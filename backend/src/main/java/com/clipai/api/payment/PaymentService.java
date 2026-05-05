package com.clipai.api.payment;

import com.clipai.api.common.ApiException;
import com.clipai.api.config.AppProperties;
import com.clipai.api.user.User;
import com.clipai.api.user.UserRole;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
    private final PaymentRepository payments;
    private final SubscriptionRepository subscriptions;
    private final AppProperties properties;

    public PaymentService(PaymentRepository payments, SubscriptionRepository subscriptions, AppProperties properties) {
        this.payments = payments;
        this.subscriptions = subscriptions;
        this.properties = properties;
    }

    @Transactional
    public PaymentDtos.CreateOrderResponse createOrder(User user, PaymentDtos.CreateOrderRequest request) throws Exception {
        int amount = amountFor(request.plan());
        if (properties.local().mockPayments()) {
            Payment payment = new Payment();
            payment.setUser(user);
            payment.setPlan(request.plan());
            payment.setAmountPaise(amount);
            payment.setRazorpayOrderId("order_mock_" + UUID.randomUUID());
            payments.save(payment);
            return new PaymentDtos.CreateOrderResponse(payment.getRazorpayOrderId(), amount, "INR", "rzp_mock_local");
        }
        RazorpayClient client = new RazorpayClient(properties.razorpay().keyId(), properties.razorpay().keySecret());
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amount);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "clipai_" + System.currentTimeMillis());
        Order order = client.orders.create(orderRequest);

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setPlan(request.plan());
        payment.setAmountPaise(amount);
        payment.setRazorpayOrderId(order.get("id"));
        payments.save(payment);
        return new PaymentDtos.CreateOrderResponse(payment.getRazorpayOrderId(), amount, "INR", properties.razorpay().keyId());
    }

    @Transactional
    public PaymentDtos.PaymentResponse verify(User user, PaymentDtos.VerifyPaymentRequest request) throws Exception {
        Payment payment = payments.findByRazorpayOrderId(request.razorpayOrderId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (!payment.getUser().getId().equals(user.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Payment belongs to another user");
        }
        if (properties.local().mockPayments()) {
            activate(payment, request.razorpayPaymentId());
            return new PaymentDtos.PaymentResponse(payment.getStatus(), payment.getPlan());
        }
        JSONObject options = new JSONObject();
        options.put("razorpay_order_id", request.razorpayOrderId());
        options.put("razorpay_payment_id", request.razorpayPaymentId());
        options.put("razorpay_signature", request.razorpaySignature());
        if (!Utils.verifyPaymentSignature(options, properties.razorpay().keySecret())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid payment signature");
        }
        activate(payment, request.razorpayPaymentId());
        return new PaymentDtos.PaymentResponse(payment.getStatus(), payment.getPlan());
    }

    @Transactional
    public void handleWebhook(String payload, String signature) throws Exception {
        if (properties.local().mockPayments()) {
            return;
        }
        if (!Utils.verifyWebhookSignature(payload, signature, properties.razorpay().webhookSecret())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid webhook signature");
        }
        JSONObject event = new JSONObject(payload);
        if ("payment.captured".equals(event.optString("event"))) {
            JSONObject paymentEntity = event.getJSONObject("payload").getJSONObject("payment").getJSONObject("entity");
            String orderId = paymentEntity.getString("order_id");
            String paymentId = paymentEntity.getString("id");
            payments.findByRazorpayOrderId(orderId).ifPresent(payment -> activate(payment, paymentId));
        }
    }

    private void activate(Payment payment, String paymentId) {
        payment.setStatus(PaymentStatus.PAID);
        payment.setRazorpayPaymentId(paymentId);
        payment.getUser().setRole(UserRole.PREMIUM);

        Subscription subscription = new Subscription();
        subscription.setUser(payment.getUser());
        subscription.setPlan(payment.getPlan());
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscription.setStartsAt(Instant.now());
        subscription.setEndsAt(Instant.now().plus(payment.getPlan() == PlanType.PREMIUM_YEARLY ? 365 : 30, ChronoUnit.DAYS));
        subscriptions.save(subscription);
    }

    private int amountFor(PlanType plan) {
        return switch (plan) {
            case PREMIUM_MONTHLY -> 99900;
            case PREMIUM_YEARLY -> 999900;
            case FREE -> throw new ApiException(HttpStatus.BAD_REQUEST, "Free plan does not require payment");
        };
    }
}

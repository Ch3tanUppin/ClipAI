package com.clipai.api.payment;

import com.clipai.api.user.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/payments/order")
    PaymentDtos.CreateOrderResponse order(@AuthenticationPrincipal User user, @Valid @RequestBody PaymentDtos.CreateOrderRequest request) throws Exception {
        return paymentService.createOrder(user, request);
    }

    @PostMapping("/payments/verify")
    PaymentDtos.PaymentResponse verify(@AuthenticationPrincipal User user, @Valid @RequestBody PaymentDtos.VerifyPaymentRequest request) throws Exception {
        return paymentService.verify(user, request);
    }

    @PostMapping("/webhooks/razorpay")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void webhook(HttpServletRequest request, @RequestHeader("X-Razorpay-Signature") String signature) throws Exception {
        paymentService.handleWebhook(readBody(request), signature);
    }

    private String readBody(HttpServletRequest request) throws IOException {
        return new String(request.getInputStream().readAllBytes(), request.getCharacterEncoding() == null ? "UTF-8" : request.getCharacterEncoding());
    }
}


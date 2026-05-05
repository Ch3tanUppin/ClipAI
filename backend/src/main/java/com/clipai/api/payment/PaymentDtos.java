package com.clipai.api.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class PaymentDtos {
    private PaymentDtos() {}

    public record CreateOrderRequest(@NotNull PlanType plan) {}
    public record CreateOrderResponse(String orderId, int amountPaise, String currency, String keyId) {}
    public record VerifyPaymentRequest(@NotBlank String razorpayOrderId, @NotBlank String razorpayPaymentId, @NotBlank String razorpaySignature) {}
    public record PaymentResponse(PaymentStatus status, PlanType plan) {}
}


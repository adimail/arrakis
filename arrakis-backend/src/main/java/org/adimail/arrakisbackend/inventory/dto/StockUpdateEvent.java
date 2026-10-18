package org.adimail.arrakisbackend.inventory.dto;

public record StockUpdateEvent(
        String variantId,
        String variantTitle,
        String productTitle,
        int newQuantity,
        boolean isLowStock
) {}
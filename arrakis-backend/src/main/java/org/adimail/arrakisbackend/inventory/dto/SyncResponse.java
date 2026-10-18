package org.adimail.arrakisbackend.inventory.dto;

public record SyncResponse(String message, int syncedProductsCount, String syncedAt) {}
package org.adimail.arrakisbackend.inventory.dto;

import java.util.List;

public record ProductResponse(
        String id,
        String title,
        String vendor,
        String productType,
        String status,
        int totalInventory,
        boolean isLowInventory,
        List<VariantResponse> variants
) {
    public record VariantResponse(
            String id,
            String title,
            String sku,
            String price,
            int inventoryQuantity
    ) {}
}
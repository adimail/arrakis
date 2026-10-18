package org.adimail.arrakisbackend.inventory.dto;

public record CustomThresholdVariantDto(
        String variantId,
        String variantTitle,
        String productTitle,
        String sku,
        String price,
        int alertThreshold
) {}
package org.adimail.arrakisbackend.inventory.dto;

public record UpdateThresholdRequest(
        String variantId,
        Integer threshold
) {}
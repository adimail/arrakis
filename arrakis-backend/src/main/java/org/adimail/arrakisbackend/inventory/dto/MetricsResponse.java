package org.adimail.arrakisbackend.inventory.dto;

public record MetricsResponse(long lowStockCount, int threshold) {}
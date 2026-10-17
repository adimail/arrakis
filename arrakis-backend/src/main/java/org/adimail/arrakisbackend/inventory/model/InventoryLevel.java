package org.adimail.arrakisbackend.inventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "inventory_levels")
public class InventoryLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String locationId; // Shopify Location GID: gid://shopify/Location/...

    @Column(nullable = false)
    private String locationName;

    @Column(nullable = false)
    private int availableQuantity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    public InventoryLevel() {}

    public InventoryLevel(String locationId, String locationName, int availableQuantity) {
        this.locationId = locationId;
        this.locationName = locationName;
        this.availableQuantity = availableQuantity;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLocationId() { return locationId; }
    public void setLocationId(String locationId) { this.locationId = locationId; }

    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }

    public int getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(int availableQuantity) { this.availableQuantity = availableQuantity; }

    public ProductVariant getVariant() { return variant; }
    public void setVariant(ProductVariant variant) { this.variant = variant; }
}
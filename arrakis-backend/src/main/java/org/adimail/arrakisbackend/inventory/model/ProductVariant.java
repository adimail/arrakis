package org.adimail.arrakisbackend.inventory.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    private String id; // Shopify Variant GID: gid://shopify/ProductVariant/...

    @Column(nullable = false)
    private String title;

    private String sku;
    private String price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InventoryLevel> inventoryLevels = new ArrayList<>();

    public ProductVariant() {}

    public ProductVariant(String id, String title, String sku, String price) {
        this.id = id;
        this.title = title;
        this.sku = sku;
        this.price = price;
    }

    public void addInventoryLevel(InventoryLevel level) {
        inventoryLevels.add(level);
        level.setVariant(this);
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }

    public String getPrice() { return price; }
    public void setPrice(String price) { this.price = price; }

    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }

    public List<InventoryLevel> getInventoryLevels() { return inventoryLevels; }
    public void setInventoryLevels(List<InventoryLevel> inventoryLevels) { this.inventoryLevels = inventoryLevels; }
}
package org.adimail.arrakisbackend.inventory.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "product_variants")
public class ProductVariant {

    @Id
    private String id;

    @Column(nullable = false)
    private String title;

    private String sku;
    private String price;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @OneToMany(mappedBy = "variant", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<InventoryLevel> inventoryLevels = new LinkedHashSet<>();

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

    public Set<InventoryLevel> getInventoryLevels() { return inventoryLevels; }
    public void setInventoryLevels(Set<InventoryLevel> inventoryLevels) { this.inventoryLevels = inventoryLevels; }
}
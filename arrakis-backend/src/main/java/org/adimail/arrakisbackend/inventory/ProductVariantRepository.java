package org.adimail.arrakisbackend.inventory;

import org.adimail.arrakisbackend.inventory.model.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {
}
package org.adimail.arrakisbackend.inventory;

import org.adimail.arrakisbackend.inventory.model.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {

    @Query("SELECT pv FROM ProductVariant pv JOIN FETCH pv.product p WHERE pv.alertThreshold IS NOT NULL ORDER BY p.title ASC, pv.title ASC")
    List<ProductVariant> findVariantsWithCustomThreshold();

    @Query("SELECT pv FROM ProductVariant pv JOIN FETCH pv.product p LEFT JOIN FETCH pv.inventoryLevels WHERE pv.inventoryItemId = :id")
    Optional<ProductVariant> findByInventoryItemId(@Param("id") String id);
}
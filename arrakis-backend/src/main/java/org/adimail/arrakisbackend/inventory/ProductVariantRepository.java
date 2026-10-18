package org.adimail.arrakisbackend.inventory;

import org.adimail.arrakisbackend.inventory.model.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, String> {

    @Query("SELECT pv FROM ProductVariant pv JOIN FETCH pv.product p WHERE pv.alertThreshold IS NOT NULL ORDER BY p.title ASC, pv.title ASC")
    List<ProductVariant> findVariantsWithCustomThreshold();
}
package org.adimail.arrakisbackend.inventory;

import org.adimail.arrakisbackend.inventory.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    @Query(
            value = """
            SELECT p.id
            FROM products p
            LEFT JOIN product_variants pv ON pv.product_id = p.id
            LEFT JOIN inventory_levels il ON il.variant_id = pv.id
            GROUP BY p.id
            ORDER BY p.title ASC
        """,
            countQuery = "SELECT COUNT(p.id) FROM products p",
            nativeQuery = true
    )
    Page<String> findAllProductIds(Pageable pageable);

    @Query(
            value = """
            SELECT p.id
            FROM products p
            LEFT JOIN product_variants pv ON pv.product_id = p.id
            LEFT JOIN inventory_levels il ON il.variant_id = pv.id AND il.location_id = :locationId
            GROUP BY p.id
            ORDER BY p.title ASC
        """,
            countQuery = "SELECT COUNT(p.id) FROM products p",
            nativeQuery = true
    )
    Page<String> findAllProductIdsByLocation(@Param("locationId") String locationId, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.variants v LEFT JOIN FETCH v.inventoryLevels il WHERE p.id IN :ids")
    List<Product> findProductsWithDetailsByIds(@Param("ids") List<String> ids);
}
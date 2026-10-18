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

    @Query(
            value = """
            SELECT p.id
            FROM products p
            JOIN product_variants pv ON pv.product_id = p.id
            LEFT JOIN inventory_levels il ON il.variant_id = pv.id
            GROUP BY p.id
            HAVING SUM(COALESCE(il.available_quantity, 0)) < :threshold
                OR MAX(CASE WHEN (SELECT SUM(COALESCE(il2.available_quantity, 0)) FROM inventory_levels il2 WHERE il2.variant_id = pv.id) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
            ORDER BY p.title ASC
        """,
            countQuery = """
            SELECT COUNT(DISTINCT p.id)
            FROM products p
            JOIN product_variants pv ON pv.product_id = p.id
            LEFT JOIN inventory_levels il ON il.variant_id = pv.id
            GROUP BY p.id
            HAVING SUM(COALESCE(il.available_quantity, 0)) < :threshold
                OR MAX(CASE WHEN (SELECT SUM(COALESCE(il2.available_quantity, 0)) FROM inventory_levels il2 WHERE il2.variant_id = pv.id) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
        """,
            nativeQuery = true
    )
    Page<String> findLowStockProductIds(@Param("threshold") int threshold, Pageable pageable);

    @Query(
            value = """
            SELECT p.id
            FROM products p
            JOIN product_variants pv ON pv.product_id = p.id
            LEFT JOIN inventory_levels il ON il.variant_id = pv.id AND il.location_id = :locationId
            GROUP BY p.id
            HAVING SUM(COALESCE(il.available_quantity, 0)) < :threshold
                OR MAX(CASE WHEN (SELECT SUM(COALESCE(il2.available_quantity, 0)) FROM inventory_levels il2 WHERE il2.variant_id = pv.id AND il2.location_id = :locationId) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
            ORDER BY p.title ASC
        """,
            countQuery = """
            SELECT COUNT(DISTINCT p.id)
            FROM products p
            JOIN product_variants pv ON pv.product_id = p.id
            LEFT JOIN inventory_levels il ON il.variant_id = pv.id AND il.location_id = :locationId
            GROUP BY p.id
            HAVING SUM(COALESCE(il.available_quantity, 0)) < :threshold
                OR MAX(CASE WHEN (SELECT SUM(COALESCE(il2.available_quantity, 0)) FROM inventory_levels il2 WHERE il2.variant_id = pv.id AND il2.location_id = :locationId) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
        """,
            nativeQuery = true
    )
    Page<String> findLowStockProductIdsByLocation(@Param("locationId") String locationId, @Param("threshold") int threshold, Pageable pageable);

    @Query(
            value = """
            SELECT COUNT(DISTINCT sub.id) FROM (
                SELECT p.id
                FROM products p
                JOIN product_variants pv ON pv.product_id = p.id
                LEFT JOIN inventory_levels il ON il.variant_id = pv.id
                GROUP BY p.id
                HAVING SUM(COALESCE(il.available_quantity, 0)) < :threshold
                    OR MAX(CASE WHEN (SELECT SUM(COALESCE(il2.available_quantity, 0)) FROM inventory_levels il2 WHERE il2.variant_id = pv.id) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
            ) sub
        """,
            nativeQuery = true
    )
    long countLowStockProducts(@Param("threshold") int threshold);

    @Query(
            value = """
            SELECT COUNT(DISTINCT sub.id) FROM (
                SELECT p.id
                FROM products p
                JOIN product_variants pv ON pv.product_id = p.id
                LEFT JOIN inventory_levels il ON il.variant_id = pv.id AND il.location_id = :locationId
                GROUP BY p.id
                HAVING SUM(COALESCE(il.available_quantity, 0)) < :threshold
                    OR MAX(CASE WHEN (SELECT SUM(COALESCE(il2.available_quantity, 0)) FROM inventory_levels il2 WHERE il2.variant_id = pv.id AND il2.location_id = :locationId) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
            ) sub
        """,
            nativeQuery = true
    )
    long countLowStockProductsByLocation(@Param("locationId") String locationId, @Param("threshold") int threshold);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.variants v LEFT JOIN FETCH v.inventoryLevels il WHERE p.id IN :ids")
    List<Product> findProductsWithDetailsByIds(@Param("ids") List<String> ids);
}
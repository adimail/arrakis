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
            LEFT JOIN (
                SELECT variant_id, SUM(COALESCE(available_quantity, 0)) AS variant_stock
                FROM inventory_levels
                GROUP BY variant_id
            ) vs ON vs.variant_id = pv.id
            GROUP BY p.id
            HAVING SUM(COALESCE(vs.variant_stock, 0)) < :threshold
                OR MAX(CASE WHEN COALESCE(vs.variant_stock, 0) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
            ORDER BY p.title ASC
        """,
            countQuery = """
            SELECT COUNT(DISTINCT sub.id) FROM (
                SELECT p.id
                FROM products p
                JOIN product_variants pv ON pv.product_id = p.id
                LEFT JOIN (
                    SELECT variant_id, SUM(COALESCE(available_quantity, 0)) AS variant_stock
                    FROM inventory_levels
                    GROUP BY variant_id
                ) vs ON vs.variant_id = pv.id
                GROUP BY p.id
                HAVING SUM(COALESCE(vs.variant_stock, 0)) < :threshold
                    OR MAX(CASE WHEN COALESCE(vs.variant_stock, 0) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
            ) sub
        """,
            nativeQuery = true
    )
    Page<String> findLowStockProductIds(@Param("threshold") int threshold, Pageable pageable);

    @Query(
            value = """
            SELECT p.id
            FROM products p
            JOIN product_variants pv ON pv.product_id = p.id
            LEFT JOIN (
                SELECT variant_id, SUM(COALESCE(available_quantity, 0)) AS variant_stock
                FROM inventory_levels
                WHERE location_id = :locationId
                GROUP BY variant_id
            ) vs ON vs.variant_id = pv.id
            GROUP BY p.id
            HAVING SUM(COALESCE(vs.variant_stock, 0)) < :threshold
                OR MAX(CASE WHEN COALESCE(vs.variant_stock, 0) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
            ORDER BY p.title ASC
        """,
            countQuery = """
            SELECT COUNT(DISTINCT sub.id) FROM (
                SELECT p.id
                FROM products p
                JOIN product_variants pv ON pv.product_id = p.id
                LEFT JOIN (
                    SELECT variant_id, SUM(COALESCE(available_quantity, 0)) AS variant_stock
                    FROM inventory_levels
                    WHERE location_id = :locationId
                    GROUP BY variant_id
                ) vs ON vs.variant_id = pv.id
                GROUP BY p.id
                HAVING SUM(COALESCE(vs.variant_stock, 0)) < :threshold
                    OR MAX(CASE WHEN COALESCE(vs.variant_stock, 0) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
            ) sub
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
                LEFT JOIN (
                    SELECT variant_id, SUM(COALESCE(available_quantity, 0)) AS variant_stock
                    FROM inventory_levels
                    GROUP BY variant_id
                ) vs ON vs.variant_id = pv.id
                GROUP BY p.id
                HAVING SUM(COALESCE(vs.variant_stock, 0)) < :threshold
                    OR MAX(CASE WHEN COALESCE(vs.variant_stock, 0) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
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
                LEFT JOIN (
                    SELECT variant_id, SUM(COALESCE(available_quantity, 0)) AS variant_stock
                    FROM inventory_levels
                    WHERE location_id = :locationId
                    GROUP BY variant_id
                ) vs ON vs.variant_id = pv.id
                GROUP BY p.id
                HAVING SUM(COALESCE(vs.variant_stock, 0)) < :threshold
                    OR MAX(CASE WHEN COALESCE(vs.variant_stock, 0) < COALESCE(pv.alert_threshold, :threshold) THEN 1 ELSE 0 END) = 1
            ) sub
        """,
            nativeQuery = true
    )
    long countLowStockProductsByLocation(@Param("locationId") String locationId, @Param("threshold") int threshold);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.variants v LEFT JOIN FETCH v.inventoryLevels il WHERE p.id IN :ids")
    List<Product> findProductsWithDetailsByIds(@Param("ids") List<String> ids);
}
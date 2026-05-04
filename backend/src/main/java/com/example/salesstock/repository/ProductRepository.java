package com.example.salesstock.repository;

import com.example.salesstock.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByDescriptionContainingIgnoreCase(String keyword, Pageable pageable);
}

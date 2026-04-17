package com.example.salesstock.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Entity
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_no")
    private String recordNo;

    @Column(name = "stock_no")
    private String stockNo;

    @Column(name = "part_no")
    private String partNo;

    private String manufactur;

    private String vendor;

    @Column(name = "account_no")
    private String accountNo;

    private String description;

    private String catagory;

    @Column(name = "package_size")
    private String packageSize;

    @Column(name = "package_size_order")
    private Integer packageSizeOrder;

    @Column(name = "amount_in_stock")
    private Integer amountInStock;

    @Column(name = "min_amount")
    private Integer minAmount;

    @Column(name = "max_amount")
    private Integer maxAmount;

    private String location;

    @Column(name = "inventory_markup")
    private BigDecimal inventoryMarkup;

    private BigDecimal cost;

    private BigDecimal retail;

    @Column(name = "retail2")
    private BigDecimal retail2;

    @Column(name = "retail3")
    private BigDecimal retail3;

    private Boolean taxable;

    private BigDecimal gst;

    private BigDecimal weight;

    @Column(name = "back_order_date")
    private LocalDate backOrderDate;

    @Column(name = "back_ordered")
    private Boolean backOrdered;

    @Column(name = "amount_back_ordered")
    private Integer amountBackOrdered;

    @Column(name = "back_order_amount")
    private Integer backOrderAmount; // or BigDecimal if it's monetary

    @Column(name = "p_order_no")
    private String pOrderNo;

    @Column(name = "special_item")
    private Boolean specialItem;

    @Column(name = "item_picture")
    private String itemPicture;

    private String picture;

    @Column(name = "sold_history")
    private String soldHistory; // or appropriate type based on your data

}
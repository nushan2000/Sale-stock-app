package com.example.salesstock.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

// A simple linear-trend projection over the recent daily revenue history — not a
// machine-learning forecast, just least-squares extrapolation, labelled honestly as such
// on the frontend so it doesn't read as more authoritative than it is.
@Data
@Builder
public class ForecastDto {
    private BigDecimal projectedNext7Days;
    private BigDecimal changePercent; // projected daily avg vs historical daily avg
    private String trend; // "up" | "down" | "flat"
}

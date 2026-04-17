package com.example.salesstock.service;

import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.dto.SupplierDto;
import com.example.salesstock.entity.Supplier;
import com.example.salesstock.exception.ResourceNotFoundException;
import com.example.salesstock.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public PagedResponse<Supplier> getAll(String search, int page, int size, String sort) {
        Sort s = Sort.by(Sort.Direction.ASC, sort.isEmpty() ? "name" : sort);
        Page<Supplier> result = supplierRepository.search(search, PageRequest.of(page, size, s));
        return new PagedResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public List<Supplier> getAll() {
        return supplierRepository.findAll(Sort.by("name"));
    }

    public Supplier getById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));
    }

    public Supplier create(SupplierDto dto) {
        Supplier s = new Supplier();
        mapDtoToEntity(dto, s);
        return supplierRepository.save(s);
    }

    public Supplier update(Long id, SupplierDto dto) {
        Supplier s = getById(id);
        mapDtoToEntity(dto, s);
        return supplierRepository.save(s);
    }

    public void delete(Long id) {
        supplierRepository.deleteById(id);
    }

    private void mapDtoToEntity(SupplierDto dto, Supplier s) {
        s.setName(dto.getName());
        s.setPhone(dto.getPhone());
        s.setEmail(dto.getEmail());
        s.setAddress(dto.getAddress());
        s.setNotes(dto.getNotes());
    }
}

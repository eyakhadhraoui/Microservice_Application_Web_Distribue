package com.example.dossiermedicale.Controllers;

import com.example.dossiermedicale.Services.TestLaboratoireService;
import com.example.dossiermedicale.dto.TestLaboratoireDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests-laboratoire")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TestLaboratoireController {

    private final TestLaboratoireService testLaboratoireService;

    @PostMapping
    public ResponseEntity<TestLaboratoireDTO> create(@Valid @RequestBody TestLaboratoireDTO dto) {
        TestLaboratoireDTO created = testLaboratoireService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TestLaboratoireDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody TestLaboratoireDTO dto) {
        return ResponseEntity.ok(testLaboratoireService.update(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TestLaboratoireDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(testLaboratoireService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<TestLaboratoireDTO>> getAll() {
        return ResponseEntity.ok(testLaboratoireService.getAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        testLaboratoireService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

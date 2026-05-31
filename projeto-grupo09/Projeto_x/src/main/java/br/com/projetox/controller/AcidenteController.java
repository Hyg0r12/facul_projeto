package br.com.projetox.controller;

import br.com.projetox.model.Acidente;
import br.com.projetox.repository.AcidenteRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/acidentes")
public class AcidenteController {
    private final AcidenteRepository repository;

    public AcidenteController(AcidenteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public Map<String, Object> listar() {
        return Map.of("acidentes", repository.listar());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> criar(@RequestBody Acidente acidente) {
        validar(acidente);
        int id = repository.criar(acidente);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of("mensagem", "Acidente cadastrado com sucesso.", "id", id));
    }

    @PutMapping("/{id}")
    public Map<String, Object> atualizar(@PathVariable int id, @RequestBody Acidente acidente) {
        validar(acidente);
        repository.atualizar(id, acidente);
        return Map.of("mensagem", "Acidente atualizado com sucesso.");
    }

    @DeleteMapping("/{id}")
    public Map<String, Object> excluir(@PathVariable int id) {
        repository.excluir(id);
        return Map.of("mensagem", "Acidente excluido com sucesso.");
    }

    private void validar(Acidente acidente) {
        if (acidente.getLat() == null) {
            throw new IllegalArgumentException("Latitude obrigatoria.");
        }

        if (acidente.getLng() == null) {
            throw new IllegalArgumentException("Longitude obrigatoria.");
        }

        if (vazio(acidente.getDescricao())) {
            throw new IllegalArgumentException("Descricao obrigatoria.");
        }

        if (vazio(acidente.getCategoria())) {
            throw new IllegalArgumentException("Categoria obrigatoria.");
        }

        if (vazio(acidente.getCor())) {
            throw new IllegalArgumentException("Cor obrigatoria.");
        }
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }
}

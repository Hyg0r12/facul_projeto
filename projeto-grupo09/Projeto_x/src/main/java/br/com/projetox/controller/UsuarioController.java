package br.com.projetox.controller;

import br.com.projetox.model.Usuario;
import br.com.projetox.repository.UsuarioRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioRepository repository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UsuarioController(UsuarioRepository repository) {
        this.repository = repository;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<Map<String, Object>> cadastrar(@RequestBody Usuario usuario) {
        validarCadastro(usuario);
        usuario.setSenha(passwordEncoder.encode(usuario.getSenha()));

        try {
            int id = repository.cadastrar(usuario);
            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(Map.of("mensagem", "Cadastro realizado com sucesso.", "id", id));
        } catch (DuplicateKeyException erro) {
            throw new IllegalArgumentException("E-mail ou CPF ja cadastrado.");
        }
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody Usuario dadosLogin) {
        if (vazio(dadosLogin.getEmail()) || vazio(dadosLogin.getSenha())) {
            throw new IllegalArgumentException("Informe e-mail e senha.");
        }

        Usuario usuario = repository.buscarPorEmail(dadosLogin.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("E-mail ou senha incorretos."));

        String senhaSalva = usuario.getSenha() == null ? "" : usuario.getSenha();
        boolean senhaCriptografadaConfere = senhaSalva.startsWith("$2")
                && passwordEncoder.matches(dadosLogin.getSenha(), usuario.getSenha());
        boolean senhaAntigaConfere = dadosLogin.getSenha().equals(senhaSalva);

        if (!senhaCriptografadaConfere && !senhaAntigaConfere) {
            throw new IllegalArgumentException("E-mail ou senha incorretos.");
        }

        if (senhaAntigaConfere) {
            repository.atualizarSenha(usuario.getEmail(), passwordEncoder.encode(dadosLogin.getSenha()));
        }

        return Map.of(
                "mensagem", "Login realizado com sucesso.",
                "usuario", Map.of(
                        "id", usuario.getId(),
                        "nome", usuario.getNome(),
                        "email", usuario.getEmail()
                )
        );
    }

    @GetMapping("/existe")
    public Map<String, Object> emailExiste(@RequestParam String email) {
        return Map.of("existe", repository.emailExiste(email));
    }

    @PutMapping("/senha")
    public Map<String, Object> redefinirSenha(@RequestBody Usuario dados) {
        if (vazio(dados.getEmail())) {
            throw new IllegalArgumentException("Informe o e-mail.");
        }

        if (vazio(dados.getSenha()) || dados.getSenha().length() < 6) {
            throw new IllegalArgumentException("A senha deve ter pelo menos 6 caracteres.");
        }

        if (!repository.emailExiste(dados.getEmail())) {
            throw new IllegalArgumentException("E-mail nao encontrado.");
        }

        repository.atualizarSenha(dados.getEmail(), passwordEncoder.encode(dados.getSenha()));
        return Map.of("mensagem", "Senha redefinida com sucesso.");
    }

    private void validarCadastro(Usuario usuario) {
        if (vazio(usuario.getNome())) {
            throw new IllegalArgumentException("Nome obrigatorio.");
        }

        if (vazio(usuario.getEmail())) {
            throw new IllegalArgumentException("E-mail obrigatorio.");
        }

        if (vazio(usuario.getCpf())) {
            throw new IllegalArgumentException("CPF obrigatorio.");
        }

        if (vazio(usuario.getDataNascimento())) {
            throw new IllegalArgumentException("Data de nascimento obrigatoria.");
        }

        if (vazio(usuario.getSenha()) || usuario.getSenha().length() < 6) {
            throw new IllegalArgumentException("A senha deve ter pelo menos 6 caracteres.");
        }
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }
}

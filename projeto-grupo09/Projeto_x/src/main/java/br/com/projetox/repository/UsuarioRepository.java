package br.com.projetox.repository;

import br.com.projetox.model.Usuario;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.Optional;

@Repository
public class UsuarioRepository {
    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Usuario> mapper = (rs, rowNum) -> {
        Usuario usuario = new Usuario();
        Date dataNascimento = rs.getDate("data_nascimento");

        usuario.setId(rs.getInt("id"));
        usuario.setNome(rs.getString("nome"));
        usuario.setEmail(rs.getString("email"));
        usuario.setCpf(rs.getString("cpf"));
        usuario.setTelefone(rs.getString("telefone"));
        usuario.setDataNascimento(dataNascimento == null ? null : dataNascimento.toString());
        usuario.setSenha(rs.getString("senha"));
        return usuario;
    };

    public UsuarioRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public int cadastrar(Usuario usuario) {
        String sql = """
                INSERT INTO usuarios (nome, email, cpf, telefone, data_nascimento, senha)
                VALUES (?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(conexao -> {
            PreparedStatement stmt = conexao.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            stmt.setString(1, usuario.getNome());
            stmt.setString(2, usuario.getEmail());
            stmt.setString(3, usuario.getCpf());
            stmt.setString(4, usuario.getTelefone());
            stmt.setDate(5, Date.valueOf(LocalDate.parse(usuario.getDataNascimento())));
            stmt.setString(6, usuario.getSenha());
            return stmt;
        }, keyHolder);

        Number chave = keyHolder.getKey();
        return chave == null ? 0 : chave.intValue();
    }

    public Optional<Usuario> buscarPorEmail(String email) {
        try {
            String sql = "SELECT id, nome, email, cpf, telefone, data_nascimento, senha FROM usuarios WHERE email = ?";
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, mapper, email));
        } catch (EmptyResultDataAccessException erro) {
            return Optional.empty();
        }
    }

    public boolean emailExiste(String email) {
        Integer total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM usuarios WHERE email = ?",
                Integer.class,
                email
        );

        return total != null && total > 0;
    }

    public void atualizarSenha(String email, String senhaCriptografada) {
        jdbcTemplate.update("UPDATE usuarios SET senha = ? WHERE email = ?", senhaCriptografada, email);
    }
}

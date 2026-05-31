package br.com.projetox.repository;

import br.com.projetox.model.Acidente;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;

@Repository
public class AcidenteRepository {
    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Acidente> mapper = (rs, rowNum) -> {
        Acidente acidente = new Acidente();
        acidente.setId(rs.getInt("id"));
        acidente.setLat(rs.getDouble("lat"));
        acidente.setLng(rs.getDouble("lng"));
        acidente.setDescricao(rs.getString("descricao"));
        acidente.setCriadoEm(rs.getTimestamp("criado_em").toInstant().toString());
        acidente.setUsuarioId(rs.getInt("usuario_id"));
        acidente.setCategoria(rs.getString("categoria"));
        acidente.setCor(rs.getString("cor"));
        return acidente;
    };

    public AcidenteRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Acidente> listar() {
        String sql = """
                SELECT
                    a.id,
                    a.latitude AS lat,
                    a.longitude AS lng,
                    a.descricao,
                    a.criado_em,
                    a.usuario_id,
                    c.nome AS categoria,
                    c.cor
                FROM acidentes a
                INNER JOIN categorias c ON c.id = a.categoria_id
                ORDER BY a.criado_em DESC
                """;

        return jdbcTemplate.query(sql, mapper);
    }

    public int criar(Acidente acidente) {
        int categoriaId = buscarOuCriarCategoria(acidente.getCategoria(), acidente.getCor());
        int usuarioId = resolverUsuarioId(acidente.getUsuarioId());

        String sql = """
                INSERT INTO acidentes (latitude, longitude, descricao, usuario_id, categoria_id)
                VALUES (?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(conexao -> {
            PreparedStatement stmt = conexao.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            stmt.setDouble(1, acidente.getLat());
            stmt.setDouble(2, acidente.getLng());
            stmt.setString(3, acidente.getDescricao());
            stmt.setInt(4, usuarioId);
            stmt.setInt(5, categoriaId);
            return stmt;
        }, keyHolder);

        Number chave = keyHolder.getKey();
        return chave == null ? 0 : chave.intValue();
    }

    public void atualizar(int id, Acidente acidente) {
        int categoriaId = buscarOuCriarCategoria(acidente.getCategoria(), acidente.getCor());
        String sql = """
                UPDATE acidentes
                SET latitude = ?,
                    longitude = ?,
                    descricao = ?,
                    categoria_id = ?
                WHERE id = ?
                """;

        jdbcTemplate.update(
                sql,
                acidente.getLat(),
                acidente.getLng(),
                acidente.getDescricao(),
                categoriaId,
                id
        );
    }

    public void excluir(int id) {
        jdbcTemplate.update("DELETE FROM acidentes WHERE id = ?", id);
    }

    private int buscarOuCriarCategoria(String nome, String cor) {
        List<Integer> categorias = jdbcTemplate.query(
                "SELECT id FROM categorias WHERE nome = ? LIMIT 1",
                (rs, rowNum) -> rs.getInt("id"),
                nome
        );

        if (!categorias.isEmpty()) {
            return categorias.get(0);
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(conexao -> {
            PreparedStatement stmt = conexao.prepareStatement(
                    "INSERT INTO categorias (nome, cor) VALUES (?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            stmt.setString(1, nome);
            stmt.setString(2, cor);
            return stmt;
        }, keyHolder);

        Number chave = keyHolder.getKey();
        return chave == null ? 0 : chave.intValue();
    }

    private int resolverUsuarioId(Integer usuarioId) {
        if (usuarioId != null && usuarioId > 0) {
            return usuarioId;
        }

        List<Integer> usuarios = jdbcTemplate.query(
                "SELECT id FROM usuarios ORDER BY id LIMIT 1",
                (rs, rowNum) -> rs.getInt("id")
        );

        if (!usuarios.isEmpty()) {
            return usuarios.get(0);
        }

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(conexao -> {
            PreparedStatement stmt = conexao.prepareStatement(
                    """
                    INSERT INTO usuarios (nome, email, cpf, telefone, data_nascimento, senha)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    Statement.RETURN_GENERATED_KEYS
            );
            stmt.setString(1, "Usuario Teste");
            stmt.setString(2, "teste@projetox.local");
            stmt.setString(3, "000.000.000-00");
            stmt.setString(4, "(00) 00000-0000");
            stmt.setDate(5, Date.valueOf(LocalDate.of(2000, 1, 1)));
            stmt.setString(6, "123456");
            return stmt;
        }, keyHolder);

        Number chave = keyHolder.getKey();
        return chave == null ? 0 : chave.intValue();
    }
}

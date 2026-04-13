CREATE TABLE vendedores_meli (
  id_vendedor BIGINT PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  fecha_vencimiento_token TIMESTAMPTZ NOT NULL
);

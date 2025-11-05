--------------------------ovo je template schema, morat cemo je izmijeniti/doraditi prema nasim potrebama, ali sluzi kao vodilja




-- Chromosomi
CREATE TABLE chromosomes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    length BIGINT
);

-- Geni
CREATE TABLE genes (
    id SERIAL PRIMARY KEY,
    chromosome_id INTEGER REFERENCES chromosomes(id),
    gene_id VARCHAR(100) UNIQUE NOT NULL,
    gene_name VARCHAR(255),
    start_position BIGINT NOT NULL,
    end_position BIGINT NOT NULL,
    strand CHAR(1),
    gene_type VARCHAR(50)
);

CREATE INDEX idx_genes_position ON genes(chromosome_id, start_position, end_position);

-- Uzorci
CREATE TABLE samples (
    id SERIAL PRIMARY KEY,
    sample_name VARCHAR(100) UNIQUE NOT NULL,
    breed VARCHAR(100)
);

-- Varijante
CREATE TABLE variants (
    id SERIAL PRIMARY KEY,
    chromosome_id INTEGER REFERENCES chromosomes(id),
    position BIGINT NOT NULL,
    reference_allele VARCHAR(1000) NOT NULL,
    alternate_allele VARCHAR(1000) NOT NULL,
    variant_type VARCHAR(20),
    quality FLOAT,
    filter_status VARCHAR(50),
    total_depth INTEGER,
    aditional_info TEXT
);

CREATE INDEX idx_variants_position ON variants(chromosome_id, position);

-- Genotipovi
CREATE TABLE sample_genotypes (
    id SERIAL PRIMARY KEY,
    sample_id INTEGER REFERENCES samples(id),
    variant_id INTEGER REFERENCES variants(id),
    genotype VARCHAR(10) NOT NULL,
    UNIQUE(sample_id, variant_id)
);

-- Korisnici
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer'
);
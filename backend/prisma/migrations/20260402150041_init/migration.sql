-- CreateTable
CREATE TABLE `dim_parceiros` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `api_user_id` VARCHAR(50) NULL,
    `nome_ajustado` VARCHAR(255) NOT NULL,
    `tipo` ENUM('INDUSTRIA', 'DISTRIBUIDOR') NULL,
    `cnpj` VARCHAR(20) NULL,
    `nome_fantasia` VARCHAR(255) NULL,
    `razao_social` VARCHAR(255) NULL,
    `gestor` VARCHAR(255) NULL,
    `telefone_gestor` VARCHAR(20) NULL,
    `email_gestor` VARCHAR(255) NULL,
    `data_entrada` DATE NULL,
    `data_saida` DATE NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `senha_definida` BOOLEAN NOT NULL DEFAULT false,
    `contrato_arquivo` VARCHAR(255) NULL,
    `data_atualizacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `dim_parceiros_api_user_id_idx`(`api_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dim_campanha` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(255) NOT NULL,
    `data_inicio` DATE NOT NULL,
    `data_fim` DATE NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `parceiro_id` INTEGER NULL,
    `data_atualizacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `dim_campanha_nome_data_inicio_data_fim_key`(`nome`, `data_inicio`, `data_fim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dim_campanha_produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `campanha_id` INTEGER NOT NULL,
    `codigo_barras` VARCHAR(14) NULL,
    `codigo_barras_normalizado` VARCHAR(14) NULL,
    `codigo_interno` VARCHAR(14) NULL,
    `descricao` TEXT NULL,
    `preco_normal` DECIMAL(10, 2) NULL,
    `preco_desconto` DECIMAL(10, 2) NULL,
    `data_atualizacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `laboratorio` VARCHAR(255) NULL,
    `tipo_preco` VARCHAR(100) NULL,
    `preco_desconto_cliente` DECIMAL(10, 2) NULL,
    `preco_app` DECIMAL(10, 2) NULL,
    `tipo_regra` VARCHAR(100) NULL,
    `pontuacao` INTEGER NULL,
    `rebaixe` DECIMAL(10, 2) NULL,
    `qtd_limite` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dim_campanha` ADD CONSTRAINT `dim_campanha_parceiro_id_fkey` FOREIGN KEY (`parceiro_id`) REFERENCES `dim_parceiros`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dim_campanha_produto` ADD CONSTRAINT `dim_campanha_produto_campanha_id_fkey` FOREIGN KEY (`campanha_id`) REFERENCES `dim_campanha`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

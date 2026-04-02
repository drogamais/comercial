import pandas as pd
from sqlalchemy import create_engine

def executar_sincronizacao():
    print("A iniciar a sincronização de dados...")

    # 1. Configurar as conexões (Formato: mysql+pymysql://user:pass@host:port/dbname)
    
    # Origem (Base de dados de produção/externa na porta 3306)
    # Substitui 'usuario' e 'senha' pelas tuas credenciais reais de leitura
    url_origem = "mysql+pymysql://drogamais:dB$MYSql%402119@10.48.12.20:3306/drogamais"
    engine_origem = create_engine(url_origem)

    # Destino (O teu MariaDB local no Docker, mapeado na porta 3307 do Windows)
    # Aqui usamos o root e a password que definiste no teu .env
    url_destino = "mysql+pymysql://root:rootpass@127.0.0.1:3307/comercial_dev"
    engine_destino = create_engine(url_destino)

    # 2. Definir o mapeamento do que extrair e onde inserir
    tarefas = [
        {
            "query_origem": "SELECT * FROM drogamais.dim_campanha",
            "tabela_destino": "dim_campanha"
        },
        {
            "query_origem": "SELECT * FROM drogamais.dim_campanha_produto",
            "tabela_destino": "dim_campanha_produto"
        },
        {
            "query_origem": "SELECT * FROM drogamais.dim_parceiros",
            "tabela_destino": "dim_parceiros"
        }
    ]

    # 3. Executar o fluxo ETL
    for tarefa in tarefas:
        tabela = tarefa['tabela_destino']
        
        print(f"\n[Extração] A ler dados para a tabela: {tabela}...")
        try:
            # Extrai os dados da origem para um DataFrame
            df = pd.read_sql(tarefa['query_origem'], engine_origem)
            
            if df.empty:
                print(f"Nenhum dado encontrado para {tabela}.")
                continue

            print(f"[Carga] A inserir {len(df)} registos em {tabela} (porta 3307)...")
            
            # Insere no destino. 
            # if_exists='append' garante que adiciona os dados às tabelas 
            # que o Prisma já criou, em vez de recriar a tabela.
            df.to_sql(
                name=tabela,
                con=engine_destino,
                if_exists='append',
                index=False,
                method='multi', # Otimiza inserções em lote
                chunksize=1000  # Insere de 1000 em 1000 para não sobrecarregar a memória
            )
            print(f"✅ Tabela {tabela} sincronizada com sucesso!")

        except Exception as e:
            print(f"❌ Erro ao processar a tabela {tabela}: {e}")

    print("\nProcesso de sincronização concluído!")

if __name__ == "__main__":
    executar_sincronizacao()
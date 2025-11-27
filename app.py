from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import sqlite3
from datetime import datetime, timedelta
import math
import random
import string
import os

app = Flask(__name__)
app.secret_key = 'ecotrace'
app.config['DATABASE'] = 'ecotrace.db'

def get_db_connection():
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Tabela de usuários
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            cargo TEXT NOT NULL,
            funcao TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            tipo TEXT CHECK(tipo IN ('gerente', 'funcionario')) NOT NULL
        )
    ''')

    # Tabela de máquinas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS maquinas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
            gerente_id INTEGER NOT NULL,
            codigo_convite TEXT UNIQUE,
            FOREIGN KEY (gerente_id) REFERENCES usuarios (id)
        )
    ''')

    # Tabela de vinculação funcionário-máquina
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS funcionario_maquina (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            funcionario_id INTEGER NOT NULL,
            maquina_id INTEGER NOT NULL,
            data_vinculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (funcionario_id) REFERENCES usuarios (id),
            FOREIGN KEY (maquina_id) REFERENCES maquinas (id)
        )
    ''')

    # Tabela de métricas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS metricas_maquina (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            maquina_id INTEGER NOT NULL,
            energia_util REAL,
            energia_total REAL,
            eficiencia REAL,
            producao REAL,
            emissao_gas REAL,
            data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (maquina_id) REFERENCES maquinas (id)
        )
    ''')

    # Tabela de progresso
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS progresso (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            funcionario_id INTEGER UNIQUE NOT NULL,
            xp INTEGER DEFAULT 0,
            nivel INTEGER DEFAULT 1,
            streak INTEGER DEFAULT 0,
            ultimo_login DATE,
            data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (funcionario_id) REFERENCES usuarios (id)
        )
    ''')

    # Tabela de feedbacks
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedbacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            remetente_id INTEGER NOT NULL,
            destinatario_id INTEGER NOT NULL,
            maquina_id INTEGER,
            mensagem TEXT NOT NULL,
            tipo TEXT CHECK(tipo IN ('elogio', 'sugestao', 'alerta')) NOT NULL,
            data_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            lida BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (remetente_id) REFERENCES usuarios (id),
            FOREIGN KEY (destinatario_id) REFERENCES usuarios (id),
            FOREIGN KEY (maquina_id) REFERENCES maquinas (id)
        )
    ''')

    # Tabela de conquistas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conquistas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            funcionario_id INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            nome TEXT NOT NULL,
            descricao TEXT,
            data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (funcionario_id) REFERENCES usuarios (id)
        )
    ''')

    # Tabela de unidades concluídas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS unidades_concluidas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            funcionario_id INTEGER NOT NULL,
            unit_id TEXT NOT NULL,
            data_conclusao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            eficiencia REAL,
            UNIQUE(funcionario_id, unit_id),
            FOREIGN KEY (funcionario_id) REFERENCES usuarios (id)
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ Banco de dados SQLite inicializado com sucesso!")

# Inicializar o banco
init_db()

# Função pra atualizar nível com base no XP
def atualizar_nivel(funcionario_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT xp FROM progresso WHERE funcionario_id = ?", (funcionario_id,))
    resultado = cursor.fetchone()
    
    if resultado:
        xp = resultado[0]
        novo_nivel = max(1, math.floor((xp // 100) + 1))

        cursor.execute("UPDATE progresso SET nivel = ? WHERE funcionario_id = ?", (novo_nivel, funcionario_id))
        conn.commit()
    
    conn.close()

# Função para verificar e atualizar streak
def atualizar_streak(funcionario_id):
    conn = get_db_connection()
    
    hoje = datetime.now().date()
    
    cursor = conn.cursor()
    cursor.execute("SELECT streak, ultimo_login FROM progresso WHERE funcionario_id = ?", (funcionario_id,))
    progresso = cursor.fetchone()
    
    if progresso:
        ultimo_login = progresso['ultimo_login'] if progresso['ultimo_login'] else None
        streak_atual = progresso['streak']
        
        if ultimo_login:
            diferenca_dias = (hoje - datetime.strptime(ultimo_login, '%Y-%m-%d').date()).days
            
            if diferenca_dias == 1:
                novo_streak = streak_atual + 1
            elif diferenca_dias == 0:
                novo_streak = streak_atual
            else:
                novo_streak = 1
        else:
            novo_streak = 1
        
        cursor.execute("UPDATE progresso SET streak = ?, ultimo_login = ? WHERE funcionario_id = ?", 
                      (novo_streak, hoje.isoformat(), funcionario_id))
        conn.commit()
    
    conn.close()

# Função para verificar conquistas
def verificar_conquistas(funcionario_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Buscar dados do funcionário
    cursor.execute("SELECT xp, nivel, streak FROM progresso WHERE funcionario_id = ?", (funcionario_id,))
    progresso = cursor.fetchone()
    
    cursor.execute("SELECT COUNT(*) as total FROM metricas_maquina mm JOIN funcionario_maquina fm ON mm.maquina_id = fm.maquina_id WHERE fm.funcionario_id = ?", (funcionario_id,))
    metricas_count = cursor.fetchone()[0]
    
    # Conquistas baseadas em XP
    conquistas_xp = [
        (50, "Iniciante Energético", "Ganhou 50 XP"),
        (200, "Economizador", "Ganhou 200 XP"),
        (500, "Especialista em Eficiência", "Ganhou 500 XP"),
        (1000, "Mestre da Sustentabilidade", "Ganhou 1000 XP")
    ]
    
    for xp_requerido, nome, descricao in conquistas_xp:
        if progresso['xp'] >= xp_requerido:
            cursor.execute("SELECT id FROM conquistas WHERE funcionario_id = ? AND tipo = ?", 
                          (funcionario_id, f"xp_{xp_requerido}"))
            if not cursor.fetchone():
                cursor.execute("INSERT INTO conquistas (funcionario_id, tipo, nome, descricao) VALUES (?, ?, ?, ?)",
                              (funcionario_id, f"xp_{xp_requerido}", nome, descricao))
    
    # Conquista de streak
    if progresso['streak'] >= 7:
        cursor.execute("SELECT id FROM conquistas WHERE funcionario_id = ? AND tipo = 'streak_7'", (funcionario_id,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO conquistas (funcionario_id, tipo, nome, descricao) VALUES (?, ?, ?, ?)",
                          (funcionario_id, 'streak_7', 'Comprometido', 'Login por 7 dias consecutivos'))
    
    # Conquista de métricas registradas
    if metricas_count >= 10:
        cursor.execute("SELECT id FROM conquistas WHERE funcionario_id = ? AND tipo = 'metricas_10'", (funcionario_id,))
        if not cursor.fetchone():
            cursor.execute("INSERT INTO conquistas (funcionario_id, tipo, nome, descricao) VALUES (?, ?, ?, ?)",
                          (funcionario_id, 'metricas_10', 'Monitor Ativo', 'Registrou 10 métricas de eficiência'))
    
    conn.commit()
    conn.close()

# Rotas principais
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/cadastro', methods=['GET', 'POST'])
def cadastro():
    if request.method == 'POST':
        nome = request.form['nome']
        cargo = request.form['cargo']
        funcao = request.form['funcao']
        email = request.form['email']
        senha = request.form['senha']
        tipo = request.form['tipo']

        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("INSERT INTO usuarios (nome, cargo, funcao, email, senha, tipo) VALUES (?,?,?,?,?,?)",
                           (nome, cargo, funcao, email, senha, tipo))
            conn.commit()

            if tipo == 'funcionario':
                cursor.execute("SELECT id FROM usuarios WHERE email=?", (email,))
                user_id = cursor.fetchone()[0]
                cursor.execute("INSERT INTO progresso (funcionario_id) VALUES (?)", (user_id,))
                conn.commit()
                
            flash('Cadastro realizado com sucesso!', 'success')
            
        except Exception as e:
            flash(f'Erro ao cadastrar: {e}', 'error')
            
        finally:
            conn.close()
            
        return redirect(url_for('login'))

    return render_template('cadastro.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        senha = request.form['senha']

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM usuarios WHERE email=? AND senha=?", (email, senha))
        user = cursor.fetchone()
        conn.close()

        if user:
            session['user_id'] = user['id']
            session['tipo'] = user['tipo']
            session['nome'] = user['nome']
            
            # Atualizar streak para funcionários
            if user['tipo'] == 'funcionario':
                atualizar_streak(user['id'])
            
            if user['tipo'] == 'gerente':
                return redirect(url_for('painel_gerente'))
            else:
                return redirect(url_for('painel_funcionario'))
        else:
            flash('Email ou senha incorretos.', 'error')
            
    return render_template('index.html')

@app.route('/painel_funcionario')
def painel_funcionario():
    if 'tipo' not in session or session['tipo'] != 'funcionario':
        return redirect(url_for('login'))

    conn = get_db_connection()
    
    # Buscar progresso do funcionário
    progresso = conn.execute("SELECT * FROM progresso WHERE funcionario_id = ?", (session['user_id'],)).fetchone()
    
    # Buscar máquinas vinculadas
    maquinas = conn.execute("""
        SELECT m.* FROM maquinas m
        JOIN funcionario_maquina fm ON m.id = fm.maquina_id
        WHERE fm.funcionario_id = ?
    """, (session['user_id'],)).fetchall()
    
    # Buscar feedbacks não lidos
    feedbacks = conn.execute("""
        SELECT f.*, u.nome as remetente_nome, m.nome as maquina_nome
        FROM feedbacks f
        JOIN usuarios u ON f.remetente_id = u.id
        LEFT JOIN maquinas m ON f.maquina_id = m.id
        WHERE f.destinatario_id = ? AND f.lida = FALSE
        ORDER BY f.data_envio DESC
    """, (session['user_id'],)).fetchall()
    
    # Buscar conquistas
    conquistas = conn.execute("""
        SELECT * FROM conquistas 
        WHERE funcionario_id = ?
        ORDER BY data_conquista DESC
        LIMIT 5
    """, (session['user_id'],)).fetchall()
    
    conn.close()

    return render_template('painel_funcionario.html', 
                          progresso=progresso, 
                          maquinas=maquinas,
                          feedbacks=feedbacks,
                          conquistas=conquistas)

@app.route('/painel_gerente')
def painel_gerente():
    if 'tipo' not in session or session['tipo'] != 'gerente':
        return redirect(url_for('login'))

    conn = get_db_connection()
    
    # Buscar máquinas do gerente
    maquinas = conn.execute("SELECT * FROM maquinas WHERE gerente_id = ?", (session['user_id'],)).fetchall()
    
    # Buscar ranking de funcionários
    ranking = conn.execute("""
        SELECT u.id, u.nome, 
               IFNULL(AVG(mm.eficiencia), 0) AS eficiencia_media,
               IFNULL(pr.xp, 0) AS xp,
               IFNULL(pr.nivel, 1) AS nivel,
               IFNULL(pr.streak, 0) AS streak
        FROM usuarios u
        LEFT JOIN funcionario_maquina fm ON u.id = fm.funcionario_id
        LEFT JOIN maquinas m ON fm.maquina_id = m.id
        LEFT JOIN metricas_maquina mm ON m.id = mm.maquina_id
        LEFT JOIN progresso pr ON u.id = pr.funcionario_id
        WHERE u.tipo = 'funcionario' AND m.gerente_id = ?
        GROUP BY u.id, u.nome, pr.xp, pr.nivel, pr.streak
        ORDER BY pr.nivel DESC, pr.xp DESC
    """, (session['user_id'],)).fetchall()
    
    # Buscar métricas gerais
    metricas_gerais = conn.execute("""
        SELECT 
            COUNT(DISTINCT u.id) as total_funcionarios,
            COUNT(DISTINCT m.id) as total_maquinas,
            IFNULL(AVG(mm.eficiencia), 0) as eficiencia_media_geral
        FROM maquinas m
        LEFT JOIN metricas_maquina mm ON m.id = mm.maquina_id
        LEFT JOIN funcionario_maquina fm ON m.id = fm.maquina_id
        LEFT JOIN usuarios u ON fm.funcionario_id = u.id
        WHERE m.gerente_id = ?
    """, (session['user_id'],)).fetchone()
    
    conn.close()

    return render_template('painel_gerente.html', 
                          ranking=ranking, 
                          maquinas=maquinas,
                          metricas_gerais=metricas_gerais)

# API Routes
@app.route('/registrar_metricas', methods=['POST'])
def registrar_metricas():
    if 'user_id' not in session or session['tipo'] != 'funcionario':
        return jsonify({'status': 'erro', 'mensagem': 'Acesso não autorizado.'}), 403

    data = request.get_json()
    maquina_id = data.get('maquina_id')
    energia_util = data.get('energia_util')
    energia_total = data.get('energia_total')
    producao = data.get('producao')
    emissao_gas = data.get('emissao_gas', 0)
    
    # Calcular eficiência
    eficiencia = (energia_util / energia_total) * 100 if energia_total > 0 else 0

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO metricas_maquina (maquina_id, energia_util, energia_total, eficiencia, producao, emissao_gas)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (maquina_id, energia_util, energia_total, eficiencia, producao, emissao_gas))
        
        # Dar XP baseado na eficiência
        xp_ganho = min(100, int(eficiencia / 10))
        
        cursor.execute("UPDATE progresso SET xp = xp + ? WHERE funcionario_id = ?", 
                      (xp_ganho, session['user_id']))
        
        conn.commit()
        
        # Atualizar nível e verificar conquistas
        atualizar_nivel(session['user_id'])
        verificar_conquistas(session['user_id'])
        
        return jsonify({
            'status': 'sucesso',
            'mensagem': f'Métricas registradas! Eficiência: {eficiencia:.2f}%. +{xp_ganho} XP ganhos.',
            'eficiencia': eficiencia,
            'xp_ganho': xp_ganho
        })
        
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': f'Erro no banco de dados: {e}'}), 500
        
    finally:
        conn.close()

@app.route('/enviar_feedback', methods=['POST'])
def enviar_feedback():
    if 'user_id' not in session:
        return jsonify({'status': 'erro', 'mensagem': 'Usuário não autenticado.'}), 401

    data = request.get_json()
    destinatario_id = data.get('destinatario_id')
    maquina_id = data.get('maquina_id')
    mensagem = data.get('mensagem')
    tipo = data.get('tipo', 'sugestao')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO feedbacks (remetente_id, destinatario_id, maquina_id, mensagem, tipo)
            VALUES (?, ?, ?, ?, ?)
        """, (session['user_id'], destinatario_id, maquina_id, mensagem, tipo))
        
        conn.commit()
        
        return jsonify({
            'status': 'sucesso',
            'mensagem': 'Feedback enviado com sucesso!'
        })
        
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': f'Erro no banco de dados: {e}'}), 500
        
    finally:
        conn.close()

@app.route('/marcar_feedback_lido', methods=['POST'])
def marcar_feedback_lido():
    if 'user_id' not in session:
        return jsonify({'status': 'erro', 'mensagem': 'Usuário não autenticado.'}), 401

    data = request.get_json()
    feedback_id = data.get('feedback_id')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE feedbacks SET lida = TRUE WHERE id = ? AND destinatario_id = ?", 
                      (feedback_id, session['user_id']))
        
        conn.commit()
        
        return jsonify({
            'status': 'sucesso',
            'mensagem': 'Feedback marcado como lido.'
        })
        
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': f'Erro no banco de dados: {e}'}), 500
        
    finally:
        conn.close()

@app.route('/criar_maquina', methods=['POST'])
def criar_maquina():
    if 'tipo' not in session or session['tipo'] != 'gerente':
        return jsonify({'status': 'erro', 'mensagem': 'Acesso não autorizado.'}), 403

    data = request.get_json()
    nome = data.get('nome')
    descricao = data.get('descricao')
    
    # Gerar código de convite único
    codigo_convite = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO maquinas (nome, descricao, gerente_id, codigo_convite)
            VALUES (?, ?, ?, ?)
        """, (nome, descricao, session['user_id'], codigo_convite))
        
        conn.commit()
        
        return jsonify({
            'status': 'sucesso',
            'mensagem': 'Máquina criada com sucesso!',
            'codigo_convite': codigo_convite
        })
        
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': f'Erro no banco de dados: {e}'}), 500
        
    finally:
        conn.close()

@app.route('/vincular_maquina', methods=['POST'])
def vincular_maquina():
    if 'tipo' not in session or session['tipo'] != 'funcionario':
        return jsonify({'status': 'erro', 'mensagem': 'Acesso não autorizado.'}), 403

    data = request.get_json()
    codigo_convite = data.get('codigo_convite')

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Verificar se o código existe
        cursor.execute("SELECT id FROM maquinas WHERE codigo_convite = ?", (codigo_convite,))
        maquina = cursor.fetchone()
        
        if not maquina:
            return jsonify({'status': 'erro', 'mensagem': 'Código de convite inválido.'}), 400
        
        maquina_id = maquina[0]
        
        # Verificar se já está vinculado
        cursor.execute("SELECT id FROM funcionario_maquina WHERE funcionario_id = ? AND maquina_id = ?", 
                      (session['user_id'], maquina_id))
        if cursor.fetchone():
            return jsonify({'status': 'erro', 'mensagem': 'Você já está vinculado a esta máquina.'}), 400
        
        # Vincular funcionário à máquina
        cursor.execute("INSERT INTO funcionario_maquina (funcionario_id, maquina_id) VALUES (?, ?)",
                      (session['user_id'], maquina_id))
        
        conn.commit()
        
        return jsonify({
            'status': 'sucesso',
            'mensagem': 'Vinculado à máquina com sucesso!'
        })
        
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': f'Erro no banco de dados: {e}'}), 500
        
    finally:
        conn.close()

@app.route('/iniciar_atividade', methods=['POST'])
def iniciar_atividade():
    if 'user_id' not in session:
        return jsonify({'status': 'erro', 'mensagem': 'Usuário não autenticado.'}), 401

    data = request.get_json()
    unit_id = data.get('unit_id')
    unit_type = data.get('unit_type')

    return jsonify({
        'status': 'sucesso',
        'mensagem': 'Atividade iniciada',
        'unit_id': unit_id,
        'unit_type': unit_type
    })

@app.route('/completar_unidade', methods=['POST'])
def completar_unidade():
    if 'user_id' not in session:
        return jsonify({'status': 'erro', 'mensagem': 'Usuário não autenticado.'}), 401

    data = request.get_json()
    unit_id = data.get('unit_id')
    xp_ganho = data.get('xp', 0)
    eficiencia = data.get('eficiencia', 0)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Atualizar XP do funcionário
        cursor.execute("UPDATE progresso SET xp = xp + ? WHERE funcionario_id = ?", 
                      (xp_ganho, session['user_id']))
        
        # Registrar conclusão da unidade
        cursor.execute("""
            INSERT OR REPLACE INTO unidades_concluidas (funcionario_id, unit_id, eficiencia)
            VALUES (?, ?, ?)
        """, (session['user_id'], unit_id, eficiencia))
        
        conn.commit()
        
        # Atualizar nível e verificar conquistas
        atualizar_nivel(session['user_id'])
        verificar_conquistas(session['user_id'])
        
        return jsonify({
            'status': 'sucesso',
            'mensagem': f'Unidade concluída! +{xp_ganho} XP ganhos.',
            'xp_ganho': xp_ganho
        })
        
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': f'Erro no banco de dados: {e}'}), 500
        
    finally:
        conn.close()

@app.route('/completar_atividade', methods=['POST'])
def completar_atividade():
    if 'user_id' not in session:
        return jsonify({'status': 'erro', 'mensagem': 'Usuário não autenticado.'}), 401

    data = request.get_json()
    funcionario_id = session['user_id']
    ganho_xp = data.get('xp', 50)
    eficiencia = data.get('eficiencia', 0)
    maquina_id = data.get('maquina_id', None)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Atualiza XP do funcionário
        cursor.execute("UPDATE progresso SET xp = xp + ? WHERE funcionario_id = ?", (ganho_xp, funcionario_id))

        # Registra a eficiência da atividade concluída
        if maquina_id:
            cursor.execute("""
                INSERT INTO metricas_maquina (maquina_id, eficiencia, data_registro)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            """, (maquina_id, eficiencia))

        conn.commit()

        # Atualiza o nível com base no XP total
        atualizar_nivel(funcionario_id)
        
        # Verificar conquistas
        verificar_conquistas(funcionario_id)

        return jsonify({
            'status': 'sucesso',
            'mensagem': f'Atividade concluída! +{ganho_xp} XP ganhos. Eficiência: {eficiencia}% registrada.'
        })
        
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': f'Erro no banco de dados: {e}'}), 500
        
    finally:
        conn.close()

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
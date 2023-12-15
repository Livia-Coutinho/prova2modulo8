function animalExists(tableName, id, callback) {           // verifica se o animal existe
  const query = `SELECT COUNT(*) as count FROM ${tableName} WHERE id = ?`;
  db.get(query, [id], (err, row) => {
    if (err) {
      // Tratamento do erro com retorno adequado
      callback(false, "Erro ao verificar a existência do animal");
    } else {
      const exists = row.count > 0;
      callback(exists, null); //Callback sem enviar erro em caso de sucesso
    }
  });
}

app.post('/dogs', (req, res) => {      // inserir dados na tabela dogs usando prepared statement

  const name = req.body.name;

  const stmt = db.prepare("INSERT INTO dogs (name, votes) VALUES (?, ?)");
  stmt.run(name, 0, function(err) {
    stmt.finalize(); // finalização do statement após uso

    if (err) {
      res.status(500).send("Erro ao inserir no banco de dados");
    } else {
      res.status(201).json({ id: this.lastID, name, votes: 0 });
    }
  });
});

// Rota de votação
app.post('/vote/:animalType/:id', (req, res) => {
  const animalType = req.params.animalType;
  const id = req.params.id;

  animalExists(animalType, id, (exists, error) => { // correção do nome da variável para error

    if (error) {
      res.status(500).send(error); // envio do erro recebido na verificação
    } else if (!exists) {
      res.status(404).send("Animal não encontrado");
    } else {
      const stmt = db.prepare(`UPDATE ${animalType} SET votes = votes + 1 WHERE id = ?`);
      stmt.run(id, function(err) {
        stmt.finalize(); // finalização do statement após uso

        if (err) {
          res.status(500).send("Erro ao atualizar os votos no banco de dados");
        } else {
          res.status(200).send("Voto computado");
        }
      });
    }
  });
});

// Rota para obter todos os gatos
app.get('/cats', (req, res) => {
  animalExists('cats', req.params.id, (exists, error) => {
    if (error) {
      res.status(500).send(error);
    } else if (!exists) {
      res.status(404).send("Gato não encontrado");
    } else {
      db.all("SELECT * FROM cats", [], (err, rows) => {
        if (err) {
          res.status(500).send("Erro ao consultar o banco de dados de gatos");
        } else {
          res.json(rows);
        }
      });
    }
  });
});

// Rota para obter todos os cachorros
app.get('/dogs', (req, res) => {
  animalExists('dogs', req.params.id, (exists, error) => {
    if (error) {
      res.status(500).send(error);
    } else if (!exists) {
      res.status(404).send("Cachorro não encontrado");
    } else {
      db.all("SELECT * FROM dogs", [], (err, rows) => {
        if (err) {
          res.status(500).send("Erro ao consultar o banco de dados de cachorros");
        } else {
          res.json(rows);
        }
      });
    }
  });
});



// tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Ocorreu um erro');
});

app.listen(port, () => {
  console.log(`Votação cats and dogs rodando em http://localhost:${port}`);
});

import express, { Request, Response }  from "express";
import { ConnectionPool, config as SqlConfig } from "mssql";
import cors from "cors";
import dotenv from "dotenv";
import { cRecCSV } from "./readAndSendCsv";
import multer from "multer";
import path from "path";


dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());


// Configurações do banco de dados
const dbConfig: SqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST || "",
  database: process.env.DB_NAME,
  options: {
    encrypt: true, 
    trustServerCertificate: true,
  },
};

// Rota para obter dados do banco
app.get("/pesquisa", async (req: Request, res: Response) => {
  try {
    const pool = await new ConnectionPool(dbConfig).connect();
    const result = await pool.request().query("select * from pesquisa"); 
    res.json(result.recordset);
  } catch (error) {
    console.error("Erro ao buscar dados do banco:", error);
    res.status(500).json({ error: "Erro ao conectar ao banco de dados." });
  }
}); 

// Rota para obter dados do banco
app.get("/candidatos", async (req: Request, res: Response) => {
  try {
    const pool = await new ConnectionPool(dbConfig).connect();
    const result = await pool.request().query("select * from CANDIDATO"); // 
    res.json(result.recordset);
  } catch (error) {
    console.error("Erro ao buscar dados do banco:", error);
    res.status(500).json({ error: "Erro ao conectar ao banco de dados." });
  }
}); 

// Os arquivos serão armazenados temporariamente na pasta 'uploads'
const upload = multer({ dest: path.join(__dirname, "./uploads") }); 

app.post("/uploadCsv", upload.single("upload"), async (req: Request, res: Response): Promise<void> => {

  try {

    if (!req.file) {
        res.status(400).json({ message: "Nenhum arquivo enviado" });
        return;
    }

      console.log(req.file.filename);
      console.log("Arquivo recebido:", req.file);
      
      let RecCSV = new cRecCSV();

      RecCSV.setCsvFilePath = req.file.filename;

      await RecCSV.funcRecCSV(req,res);

      console.log("Dados recebidos");
      res.send(RecCSV.getcsvJSON);

      insertSQL(RecCSV.getcsvJSON)

  } catch (error) {
      console.error("Erro:", error);
      res.status(500).json({ message: "Erro ao processar o arquivo" });
  }
});


async function insertSQL(csvData:any){

  const jsonData = JSON.parse(csvData);

  const pool = new ConnectionPool(dbConfig);
  try {
    await pool.connect();

    for (const row of jsonData) {
      await pool
        .request()
        .input("ID_PESQUISA", row.ID_PESQUISA)
        .input("DATA_PESQUISA", row.DATA_PESQUISA)
        .input("MUNICÍPIO", row.MUNICÍPIO)
        .input("ESTADO", row.ESTADO)
        .input("INTENÇÃO_DE_VOTO", row.INTENÇÃO_DE_VOTO)
        .query(`
          INSERT INTO PESQUISA (CD_PESQUISA, DT_PESQUISA, NM_MUNICIPIO, NM_ESTADO, CD_CANDIDATO)
          VALUES (@ID_PESQUISA, @DATA_PESQUISA, @MUNICÍPIO, @ESTADO, @INTENÇÃO_DE_VOTO)
        `);
    }

    console.log("Dados inseridos com sucesso!");
  } catch (error) {
    console.error("Erro ao inserir os dados:", error);
  } finally {
    pool.close();
  }

};

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

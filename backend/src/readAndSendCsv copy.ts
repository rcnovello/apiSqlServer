import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import iconv from "iconv-lite";

class apiFunctions{

    private csvFilePath: string = '';
    public get getCsvFilePath() {        
        return this.csvFilePath
    };    

    public set setCsvFilePath(value: string)  {
        this.csvFilePath= path.join(__dirname,`./uploads/${value}`);
    };


    private csvJSON: String = '';
    public get getcsvJSON() {        
        return this.csvJSON
    };    

    public set setcsvJSON(value: string)  {
        this.csvJSON = value;
    };



    public async readCsvToJson(filePath: string): Promise<Record<string, any>[]> {
        
        const results: Record<string, any>[] = [];
    
        return new Promise((resolve, reject) => {
            // Cria um stream com decodificação de charset
            fs.createReadStream(filePath)
                .pipe(iconv.decodeStream("latin1")) 
                .pipe(iconv.encodeStream("utf-8")) 
                .pipe(csvParser({ separator: ";" })) 
                .on("data", (data) => results.push(data))
                .on("end", () => resolve(results))
                .on("error", (error) => reject(error));
        });
    }



    // Função principal

    public async funcRecCSV(req:Request, res:Response){

        const csv = this.csvFilePath;
        const readCsvToJson = this.readCsvToJson;
  
        let results: Record<string, any>[] = [];

        async function main(): Promise<void> {

            try {
                if (!fs.existsSync(csv)) {
                    console.error("Arquivo CSV não encontrado!");
                    process.exit(1);
                }

                console.log("Lendo o arquivo CSV...");
                const jsonData = await readCsvToJson(csv);
                //console.log("Arquivo CSV convertido para JSON:", jsonData);

                results = jsonData;
                

            } catch (error) {
                console.error("Erro:", error);
            }
        };

        await main();

        const structuredData = results.map(row => {        

            const csvString = row['ID_PESQUISA;DATA_PESQUISA;MUNICÍPIO;ESTADO;INTENÇÃO DE VOTO'];

            
            // Verifica se a string é válida e faz o split
            if (csvString) {

                
              const [ID_PESQUISA, DATA_PESQUISA, MUNICÍPIO, ESTADO, INTENÇÃO_DE_VOTO] = csvString.split(';');

              //const formattedDate = formatDate(DATA_PESQUISA);
        
              return {
                ID_PESQUISA,
                DATA_PESQUISA,
                MUNICÍPIO,
                ESTADO,
                INTENÇÃO_DE_VOTO,
              };
            }
          
            // Retorna um valor nulo para casos inválidos
            return null;
          }).filter(Boolean); 
          
          console.log(structuredData);

        
        this.setcsvJSON = JSON.stringify(structuredData);

    };
};

export const cRecCSV = apiFunctions;


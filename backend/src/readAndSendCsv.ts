import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import iconv from "iconv-lite";

class apiFunctions {
    private csvFilePath: string = '';
    public get getCsvFilePath() {
        return this.csvFilePath;
    };

    public set setCsvFilePath(value: string) {
        this.csvFilePath = path.join(__dirname, `./uploads/${value}`);
    };

    private csvJSON: string = '';
    public get getcsvJSON() {
        return this.csvJSON;
    };

    public set setcsvJSON(value: string) {
        this.csvJSON = value;
    };

    public async readCsvToJson(filePath: string): Promise<Record<string, any>[]> {
        const results: Record<string, any>[] = [];
        return new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(iconv.decodeStream("latin1"))
                .pipe(iconv.encodeStream("utf-8"))
                .pipe(csvParser({ separator: ";" }))
                .on("data", (data) => results.push(data))
                .on("end", () => resolve(results))
                .on("error", (error) => reject(error));
        });
    }

    // Função para formatar datas no formato DD/MM/YYYY
    private formatDate(dateString: string): string {
        const [year, month, day] = dateString.split("/");
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }

    public async funcRecCSV(req: Request, res: Response) {
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
                results = jsonData;
            } catch (error) {
                console.error("Erro:", error);
            }
        }

        await main();

        const structuredData = results.map(row => {
            const csvString = row['ID_PESQUISA;DATA_PESQUISA;MUNICÍPIO;ESTADO;INTENÇÃO DE VOTO'];
        
            if (csvString) {
                const [ID_PESQUISA, DATA_PESQUISA, MUNICÍPIO, ESTADO, INTENÇÃO_DE_VOTO] = csvString.split(";");
        
                // Formata a data para DD/MM/YYYY
                const formattedDate = this.formatDate(DATA_PESQUISA);
        
                return {
                    ID_PESQUISA,
                    DATA_PESQUISA: formattedDate, 
                    MUNICÍPIO,
                    ESTADO,
                    INTENÇÃO_DE_VOTO,
                };
            }
        
            return null;
        }).filter(Boolean);

        console.log(structuredData);

        this.setcsvJSON = JSON.stringify(structuredData);
    }
}

export const cRecCSV = apiFunctions;

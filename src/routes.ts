import { Response, Request, Router } from "express";
import { Readable } from "stream";
import readline from "readline";

import multer from "multer";
import { client } from "./database/client";

const multerConfig = multer();

const router = Router();

interface IProduct {
  name: string;
  price: number;
  quantity: number;
}

router.get("/", async (req: Request, res: Response) => {
  res.send("Hello");
});

router.post(
  "/products",
  multerConfig.single("file"),
  async (req: Request, res: Response) => {
    const { file } = req;
    const buffer = file?.buffer;

    //Manipular o buffer com stream do node, legal porque não precisamos salva o arquivo p/ depois ler.
    const readableFile = new Readable();
    readableFile.push(buffer);
    readableFile.push(null);

    //Pegar linha por linha do arquivo csv
    const productsLine = readline.createInterface({
      input: readableFile,
    });

    const products: IProduct[] = [];

    // popular linha por linha e separa por virgula
    for await (let line of productsLine) {
      //Separa por virgula e retorna um array entre cada
      const productsLineSplit = line.split(",");
      products.push({
        name: productsLineSplit[0],
        price: Number(productsLineSplit[1]),
        quantity: Number(productsLineSplit[2]),
      });
    }

    //Salvando no banco de dados
    for await (let { name, price, quantity } of products) {
      await client.products.create({
        data: {
          name,
          price,
          quantity,
        },
      });
    }
    return res.send(products);
  }
);

export { router };

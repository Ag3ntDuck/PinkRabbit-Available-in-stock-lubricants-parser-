import puppeteer from "puppeteer";
import fs from "fs";

interface parsedLub {
  name: string;
  compound: string;
}

let parsedItems: parsedLub[] = [];

async function main() {
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  await page.goto("https://pinkrabbit.ru/catalog/geli_i_smazki/", {waitUntil: "networkidle2"})
  const success = await page.$(".btn-success")
   if (!success) {
      console.log("кнопки нема")
      return
   }
   await page.waitForSelector(".btn-success", { visible: true, timeout: 5000 });
   await page.click(".btn-success");

   await page.waitForSelector(".nums", { visible: true, timeout: 5000 }).catch(() => {
         console.log("нету нумерации");
         return null
      });

  let thing = await page.evaluate(() => {
      //находим цифру последней страницы сохраняем ее выводим в консту
      //есть nums div, в нем надо найти последний элемент и взять его текст, там будет цифра, которая нам нужна
      //ждем селектора .nums, если его нет, то выводим в консоль что нумерации нету и возвращаем null чтобы не ломать код дальше
      

      const lustPageNum = document.querySelector(".nums") as HTMLDivElement;

      if (!lustPageNum) {
         console.log("нету нумерации");
         return null
      }

      const lastChildAnchor = lustPageNum.lastElementChild as HTMLAnchorElement;
      
      const lastPageNumText = lastChildAnchor.getAttribute("href")?.split("/catalog/geli_i_smazki/?PAGEN_1=")[1];
      console.log("последняя страница: " + lastPageNumText);

      if (!lastPageNumText) {
        return null
      }
      
      const lastPageNumParsed = parseInt(lastPageNumText);
      

       return lastPageNumParsed;

   })

   if (thing) {
      //на самом деле можно задать статичное число 5 ибо дальше все только инет магаз, но так выглядит професси-анальнее
      
    for (let i = 0; i < thing; i++) {
    const linkPage = "https://pinkrabbit.ru/catalog/geli_i_smazki/?PAGEN_1=" + i;
   await page.goto(linkPage, { waitUntil: "networkidle2" });

   await page.screenshot({ path: "step1.png" });
   const collectedLinks = await page.evaluate(() => {
    const lubId = document.querySelectorAll(".item-title");
    console.log(lubId);
    const idArray: string[] = [];
    lubId.forEach((el) => {
      console.log("мы ищем ссылки");
      const hz = el.querySelector("[href]") as HTMLAnchorElement;

      const href = hz.getAttribute("href");
      if (href) {
        idArray.push(href);
      }
    });

    return idArray;
  });

  //const testArr: string[] = ["/catalog/geli_i_smazki/geli_i_smazki_aromatizirovannye/143201/", "/catalog/geli_i_smazki/geli_i_smazki_aromatizirovannye/143203/"];

  for (const link of collectedLinks) {
    try {
      //не забудь, закомментила на время тесте

    console.log("ХААААЙ МЫ ДОШЛИ ДО ПЕРЕХОда НА СТРАНИЦЫ");
    const currentLink = "https://pinkrabbit.ru" + link;
    //для тестирования, чтобы не лазить по всем страницам, а только по одной
    //const currentLink = "https://pinkrabbit.ru/catalog/geli_i_smazki/geli_i_smazki_aromatizirovannye/143203/";
    console.log(currentLink);

    console.log(link);
    await page.goto(currentLink, { waitUntil: "networkidle2" });
    console.log("перешли!!");
    await page.screenshot({ path: "govno.png" });

    await page.evaluate(() => {
      const el = document.querySelector(
        'a[href*="#stores"]',
      ) as HTMLAnchorElement;
      if (el) el.click();
    });

    const shouldSkip = await page.evaluate(() => {
      const notAvailable = document.querySelector(
        ".stores_text_wrapp",
      ) as HTMLDivElement;
      if (notAvailable) {
        console.log(notAvailable.innerText);
        if (
          notAvailable.innerText ===
          "Товара нет в наличии в розничных магазинах города"
        ) {
          console.log("проверили на нелья заказать");
          return true;
        }
      }

      const allStores = document.querySelectorAll(".title_stores");
      if (allStores.length === 1) {
        const firstEl = allStores[0] as HTMLDivElement;
        if (firstEl.innerText === "Интернет магазин") {
          console.log("проверили на интернет магазин");
          return true;
        }
      }

      return false;
    });

    if (shouldSkip) continue;

    await page.evaluate(() => {
      const sostav = document.querySelector(
        'a[href*="#sostav"]',
      ) as HTMLAnchorElement;
      if (sostav) sostav.click();
    });

      console.log('ждем .sostav')
     await page.waitForSelector(".sostav", { visible: true, timeout: 5000 });
     console.log('загрузился .sostav')
     console.log('ждем .титле')
      await page.waitForSelector("#pagetitle", { visible: true, timeout: 5000 });
      console.log('загрузился .титле')

    const pushele = await page.evaluate(() => {
     

      const sostav = document.querySelector(".sostav") as HTMLDivElement;
      const name = document.querySelector("#pagetitle") as HTMLHeadingElement;
      if (!sostav) {
        console.log("sostava net");
        return
      }

      if (!name) {
        console.log("name est");
        return
      }

      const nameText: string = name.innerText;
      const sostavText: string = sostav.innerText;
      console.log("doshli do suda");

      const elementsForPush: parsedLub = {
        name: nameText,
        compound: sostavText,
      };
      console.log("doshli do push");
      console.log(elementsForPush);
       return elementsForPush;
    });


    

    console.log(pushele + "внутри фор оф до проверки undefined")

    if (pushele) {
      //parsedItems.push(pushele)
      //итак тут мы будем писать 

    }

    console.log(pushele + "внутри фор оф после")
    console.log(parsedItems);

    
    

    } catch (err) {
      console.error('Ошибка в итерации:', err);
    }
  }
      }
   }

  console.log(parsedItems);
  fs.writeFileSync("parsedItems.json", JSON.stringify(parsedItems));
  browser.close();
}

main().catch(console.error);



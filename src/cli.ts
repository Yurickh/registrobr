#!/usr/bin/env node

import chalk from "chalk";
import ora from "ora";
import escape from "entities";
import fetchAvailableDomains from ".";
import domains from "../domains.json";

type TLD = keyof typeof domains;

interface Data {
  available: boolean;
  reason: string;
  fqdn: string;
  domain: string;
  suggestions: Array<TLD>;
}

let domain = process.argv[2] || "";

function parse(data: Data, tld: TLD) {
  if (data.available) {
    console.log(
      chalk.green(`Domínio ${chalk.bold(data.fqdn)} está disponível`)
    );

    const tldInfo = domains[tld];
    // TODO: melhorar esses textos
    console.log(chalk.yellow(`- Descrição TLD: ${tldInfo.tld_description}`));
    console.log(chalk.yellow(`- Categoria: ${tldInfo.category_name}`));
    console.log(chalk.yellow(`- Restrição: ${tldInfo.restriction || "-"}`));

    return;
  }

  console.log(
    chalk.red(`Domínio ${chalk.bold(data.fqdn)} não está disponível`)
  );
  if (data.reason) {
    console.log(chalk.red.bold(escape.decodeHTML(data.reason)));
  }

  showSuggestions(data);
}

function isValidDomain(domain: string): TLD {
  return Object.keys(domains).find(
    key => key.length <= domain.length && domain.endsWith(key)
  ) as TLD;
}

function showSuggestions(data: Data) {
  if (data.suggestions && data.suggestions.length > 0) {
    console.log(chalk.yellow("Sugestões: "));
    data.suggestions.forEach(item => {
      console.log(
        "\t" +
          chalk.yellow.bold(
            `- ${data.domain}.${item} (${domains[item].category_name})`
          )
      );
    });
  }
}

if (!domain) {
  console.log(chalk.red("Por favor, digite uma url válida."));
  process.exit(1);
}

domain = domain.toLowerCase();
const tld = isValidDomain(domain);
if (!tld) {
  console.log(
    chalk.red(
      `A url informada deve possuir uma das seguintes extensões: ${Object.keys(
        domains
      ).join(", ")}`
    )
  );
  process.exit(1);
}

const hostname = domain.substr(0, domain.length - tld.length - 1);
if (hostname.length < 2 || hostname.length > 26) {
  console.log(
    chalk.red("O Hostname deve ter no mínimo de 2 e máximo de 26 caracteres.")
  );
  process.exit(1);
}

if (
  hostname.charAt(0) === "-" ||
  hostname.charAt(hostname.length - 1) === "-"
) {
  console.log(
    chalk.red("O Hostname não deve conter hífen no ínicio ou final.")
  );
  process.exit(1);
}

if (!Number.isNaN(Number(hostname))) {
  console.log(chalk.red("O Hostname não deve conter apenas números."));
  process.exit(1);
}

if (!hostname.match(/^[a-z0-9àáâãéêíóôõúüç]+$/)) {
  console.log(
    chalk.red(
      "O Hostname deve ser a-z, 0-9, hífen e os seguintes caracteres acentuados: à, á, â, ã, é, ê, í, ó, ô, õ, ú, ü, ç."
    )
  );
  process.exit(1);
}

const spinner = ora({
  color: "yellow",
  text: chalk.yellow("Carregando ") + chalk.yellow.bold(domain)
}).start();

fetchAvailableDomains(domain)
  .then(response => {
    spinner.stop();
    parse(response, tld);
    process.exit(0);
  })
  .catch(ex => {
    spinner.stop();
    console.log(chalk.red("Alguma coisa de errado não está certo."));
    console.log(ex);
    process.exit(1);
  });

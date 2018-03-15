#!/usr/bin/env node
import inquirer from 'inquirer';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { stripIndent } from 'common-tags';

const uri = username =>
  `-/user/org.couchdb.user:${encodeURIComponent(username)}`;

const requestBody = config => ({
  _id: `org.couchdb.user:${config.username}`,
  name: config.username,
  password: config.password,
  type: 'user',
  roles: [],
  date: new Date().toISOString(),
});

const requestOptions = config => ({
  method: 'PUT',
  url: `${config.registry}${uri(config.username)}`,
  data: requestBody(config),
});

// IIFE for async flow

(async function() {
  const config = await inquirer.prompt([{
      type: 'input',
      name: 'registry',
      message: 'Registry',
    }, {
      type: 'input',
      name: 'username',
      message: 'Benutzername',
    }, {
      type: 'password',
      name: 'password',
      message: 'Passwort?',
    }, {
    type: 'confirm',
    name: 'output',
    message: 'Soll ich eine .npmrc im aktuellen Ordner anlegen?'
  }]);

  const options = requestOptions(config);

  const registryBase = config.registry.replace('https:', '');


  let response;
  try {
    response = await axios(options);
  } catch (err) {
    return console.error(`ERROR:`, err);
  }
  if (response.data && response.data.token) {
    const tokenString = `${registryBase}:_authToken=${response.data.token}`;
    console.log('tokenString', tokenString);
    console.log(`Voilà, heres ur token:\n${response.data.token}`);
    console.log('');
    console.log(tokenString)
    console.log('');
    const fileLocation = path.join(path.resolve("./"), '.npmrc')
    let fileContents = stripIndent`
      registry=${config.registry}
      always-auth=true
      email=${config.username}
      ${tokenString}
    `;

    fs.writeFile(fileLocation, fileContents, function(err) {
      if(err) console.log(err);
      console.log(`The file was saved at ${fileLocation}\n`);
    });
  }
  else {
    console.log(`Ooops, something went wrong:\n${response.data}\n`);
  }
})();


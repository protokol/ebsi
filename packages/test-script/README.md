![EBSI Logo](https://ec.europa.eu/cefdigital/wiki/images/logo/default-space-logo.svg)
![Img](../../ebsi.png)
[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)


# Test Scripts Phase 1

> Testing scripts for phase 1 of EBSI V2 Protocol Selection

#### Disclaimer - This is an experimental tool, for technical governance exploration and it is not part of EBSI releases.


## Getting started

The testing script generates a bunch of random small files and sends their hash to the ARK Core Ledger. Then it uses the EBSI V1 Timestamp API to retrieve timestamp of the transactions and checks hashes were inserted in order. Total and average timings are writting in 'testReport.txt' file.

## Installation

### Prerequisites

-   Node.js
-   Yarn

### Installing

Clone the repository and move to the root

```sh
git clone git@github.com:protokol/ebsi.git
cd ebsi
```

### Install dependencies

Install dependencies from the project directory and build project

```sh
yarn install
yarn build
```

### Move to the folder with test script

```sh
cd packages/test-script
```

### Setup .env file

Setup .env file based on .example.env. Current example.env is already operational - just move it to .env.


## Run

To launch the scripts, run the below command in the terminal:

```sh
yarn run-script
```

## Configuration

Test parameters can be edited in config.js file:

```sh
const test_params = {
  file_nb: 10,
  min_size: 10, // 10 kb
  max_size: 500, // 500kb
  delete_files: true,
  time_out: 1800000, // 30 minutes, maximum running time of the script in milliseconds
}
...
 url: "https://api.intebsi.xyz",
```

The test script will generate 'file_nb' files of random size between 'min_size' - 'max_size' (in kb).

Files are deleted after their hash is recorded but they can be kept by setting 'delete_files' to false.

The 'url' parameter is used to access the EBSI API.

## Usage

The scripts are run in the function 'phase1Scripts()' (of index.js). In order to adapt the script to another blockchain protocol, one will need to change:

-   The base url in config.js
-   The login to EBSI ledger, done in 'besuLogin()' function. //skipped
-   The sending of the hash to the ledger, done in 'notarizeHash()', using ARK Core EBSI API Timestamp implementation

The protocol should implement the Timestamp API. This API is called in the 'checkHash()' function.

The script needs a '.env' file which includes a private key for EBSI login. The file is not part of the repository and so the script will not work out-of-the box. However an .env.example file is included to explain the expected format.


## Optional - Spin local testnet

To run local database you need to install

-   Docker
-   Docker-Compose

Go to the project's root (ebsi) and run docker command

```sh
cd docker/development/testnet
docker-compose up postgres
```

Run local Ark node

```sh
yarn full:testnet
```

# Contact Us For Support And Custom Development

info@protokol.com

# License

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

This work is licensed under [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/), under the following terms:

#### Attribution

You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.

#### NonCommercial

You may not use the material for commercial purposes. For commercial purposes please reach out to info@protokol.com.

#### ShareAlike

If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.

#### Legal code

Read the rest of the obligatory [license legal code](https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode).

Copyright (c) Protokol.com 2020

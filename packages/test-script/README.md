![EBSI Logo](https://ec.europa.eu/cefdigital/wiki/images/logo/default-space-logo.svg)

# Test Scripts Phase 1

> Testing scripts for phase 1 of EBSI V2 Protocol Selection

## Disclaimer - This is an experimental tool, for technical governance exploration and it is not part of EBSI releases.

## Table of Contents

1. [Disclaimer](#Disclaimer)
2. [Getting started](#Getting)
3. [Installation](#Installation)
4. [Usage](#Usage)
5. [Run](#Run)
6. [Licensing](#Licensing)

## Getting started

The testing script generates a bunch of random small files and sends their hash to the EBSI V1 Besu Ledger. Then it uses the EBSI V1 Timestamp API to retrieve timestamp of the transactions and checks hashes were inserted in order. Total and average timings are writting in 'testReport.txt' file.

## Installation

### Prerequisites

- Node.js
- Yarn

### Installing

Move to the base directory (example: `ebsi-repo`)

```sh
cd ebsi-repo
```

Clone the repository and move to the project directory

```sh
git clone https://ec.europa.eu/cefdigital/code/scm/ebsi/test-scripts-blockchain-protocols.git
cd test-scripts-blockchain-protocols
```

### Install dependencies

Install dependencies from the project directory

```sh
yarn install
```

### Configuration

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

- The base url in config.js
- The login to EBSI ledger, done in 'besuLogin()' function.
- The sending of the hash to the ledger, done in 'notarizeHash()', using Besu API

The protocol should implement the Timestamp API. This API is called in the 'checkHash()' function.

The script needs a '.env' file which includes a private key for EBSI login. The file is not part of the repository and so the script will not work out-of-the box. However an .env.example file is included to explain the expected format.

N.b. With the EBSI V1 Besu ledger, the credential token generated in the 'besuLogin()' will last 15 minutes and no mechanism is implemented in the script to renew it, so the script will fail if file_nb parameter is too high (e.g. more than 1000 files).

## Run

To launch the scripts, run the below command in the terminal:

```sh
node index.js
```

## Licensing

Copyright (c) 2020 European Commission  
Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the European Commission - subsequent versions of the EUPL (the "Licence");
You may not use this work except in compliance with the Licence.
You may obtain a copy of the Licence at:

- https://joinup.ec.europa.eu/page/eupl-text-11-12

Unless required by applicable law or agreed to in writing, software distributed under the Licence is distributed on an "AS IS" basis, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the Licence for the specific language governing permissions and limitations under the Licence.

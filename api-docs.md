---
title: Mobile Legends API v1.0
language_tabs:
  - shell: Shell
  - javascript: JavaScript
language_clients:
  - shell: ""
  - javascript: ""
toc_footers: []
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="mobile-legends-api">Mobile Legends API v1.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

Champion, item, and scrape history data for Mobile Legends Bang Bang

Base URLs:

# Authentication

* API Key (x-rapidapi-proxy-secret)
    - Parameter Name: **x-rapidapi-proxy-secret**, in: header. 

<h1 id="mobile-legends-api-health">Health</h1>

## Health check

<a id="opIdAppController_health"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /health \
  -H 'Accept: application/json'

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('/health',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /health`

> Example responses

> 200 Response

```json
{
  "status": "ok"
}
```

<h3 id="health-check-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

<h3 id="health-check-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="mobile-legends-api-champions">Champions</h1>

## List all champions

<a id="opIdChampionsController_findAll"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /champions \
  -H 'Accept: application/json' \
  -H 'x-rapidapi-proxy-secret: API_KEY'

```

```javascript

const headers = {
  'Accept':'application/json',
  'x-rapidapi-proxy-secret':'API_KEY'
};

fetch('/champions',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /champions`

<h3 id="list-all-champions-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|role|query|string|false|Filter by role (e.g. Tank, Fighter, Mage)|
|specialty|query|string|false|Filter by specialty (e.g. Crowd Control, Burst)|
|page|query|number|false|none|
|limit|query|number|false|none|

> Example responses

> 200 Response

```json
[
  {
    "id": "string",
    "slug": "string",
    "name": "string",
    "role": [
      "string"
    ],
    "specialty": [
      "string"
    ],
    "lore": {},
    "releaseDate": {},
    "portraitUrl": {},
    "baseStats": {},
    "abilities": [
      {
        "name": "string",
        "description": "string",
        "cooldown": {},
        "type": {},
        "iconUrl": {}
      }
    ],
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

<h3 id="list-all-champions-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

<h3 id="list-all-champions-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[ChampionResponseDto](#schemachampionresponsedto)]|false|none|none|
|» id|string|true|none|none|
|» slug|string|true|none|none|
|» name|string|true|none|none|
|» role|[string]|true|none|none|
|» specialty|[string]|true|none|none|
|» lore|object|false|none|none|
|» releaseDate|object|false|none|none|
|» portraitUrl|object|false|none|none|
|» baseStats|object|true|none|none|
|» abilities|[[AbilityDto](#schemaabilitydto)]|true|none|none|
|»» name|string|true|none|none|
|»» description|string|true|none|none|
|»» cooldown|object|false|none|none|
|»» type|object|false|none|none|
|»» iconUrl|object|false|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
x-rapidapi-proxy-secret
</aside>

## Get champion by slug

<a id="opIdChampionsController_findOne"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /champions/{slug} \
  -H 'Accept: application/json' \
  -H 'x-rapidapi-proxy-secret: API_KEY'

```

```javascript

const headers = {
  'Accept':'application/json',
  'x-rapidapi-proxy-secret':'API_KEY'
};

fetch('/champions/{slug}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /champions/{slug}`

<h3 id="get-champion-by-slug-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|slug|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "slug": "string",
  "name": "string",
  "role": [
    "string"
  ],
  "specialty": [
    "string"
  ],
  "lore": {},
  "releaseDate": {},
  "portraitUrl": {},
  "baseStats": {},
  "abilities": [
    {
      "name": "string",
      "description": "string",
      "cooldown": {},
      "type": {},
      "iconUrl": {}
    }
  ],
  "createdAt": "string",
  "updatedAt": "string"
}
```

<h3 id="get-champion-by-slug-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[ChampionResponseDto](#schemachampionresponsedto)|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Champion not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
x-rapidapi-proxy-secret
</aside>

<h1 id="mobile-legends-api-items">Items</h1>

## List all items

<a id="opIdItemsController_findAll"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /items \
  -H 'Accept: application/json' \
  -H 'x-rapidapi-proxy-secret: API_KEY'

```

```javascript

const headers = {
  'Accept':'application/json',
  'x-rapidapi-proxy-secret':'API_KEY'
};

fetch('/items',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /items`

<h3 id="list-all-items-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|type|query|string|false|Filter by type (e.g. Attack, Defense, Magic)|
|tier|query|number|false|Filter by tier (1, 2, or 3)|
|page|query|number|false|none|
|limit|query|number|false|none|

> Example responses

> 200 Response

```json
[
  {
    "id": "string",
    "slug": "string",
    "name": "string",
    "type": {},
    "tier": {},
    "cost": {},
    "description": {},
    "passiveName": {},
    "passiveDescription": {},
    "stats": {},
    "components": [
      {
        "slug": "string",
        "name": "string"
      }
    ],
    "imageUrl": {},
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

<h3 id="list-all-items-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

<h3 id="list-all-items-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[ItemResponseDto](#schemaitemresponsedto)]|false|none|none|
|» id|string|true|none|none|
|» slug|string|true|none|none|
|» name|string|true|none|none|
|» type|object|false|none|none|
|» tier|object|false|none|none|
|» cost|object|false|none|none|
|» description|object|false|none|none|
|» passiveName|object|false|none|none|
|» passiveDescription|object|false|none|none|
|» stats|object|true|none|none|
|» components|[[ItemComponentDto](#schemaitemcomponentdto)]|true|none|none|
|»» slug|string|true|none|none|
|»» name|string|true|none|none|
|» imageUrl|object|false|none|none|
|» createdAt|string|true|none|none|
|» updatedAt|string|true|none|none|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
x-rapidapi-proxy-secret
</aside>

## Get item by slug

<a id="opIdItemsController_findOne"></a>

> Code samples

```shell
# You can also use wget
curl -X GET /items/{slug} \
  -H 'Accept: application/json' \
  -H 'x-rapidapi-proxy-secret: API_KEY'

```

```javascript

const headers = {
  'Accept':'application/json',
  'x-rapidapi-proxy-secret':'API_KEY'
};

fetch('/items/{slug}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

`GET /items/{slug}`

<h3 id="get-item-by-slug-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|slug|path|string|true|none|

> Example responses

> 200 Response

```json
{
  "id": "string",
  "slug": "string",
  "name": "string",
  "type": {},
  "tier": {},
  "cost": {},
  "description": {},
  "passiveName": {},
  "passiveDescription": {},
  "stats": {},
  "components": [
    {
      "slug": "string",
      "name": "string"
    }
  ],
  "imageUrl": {},
  "createdAt": "string",
  "updatedAt": "string"
}
```

<h3 id="get-item-by-slug-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|[ItemResponseDto](#schemaitemresponsedto)|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|Item not found|None|

<aside class="warning">
To perform this operation, you must be authenticated by means of one of the following methods:
x-rapidapi-proxy-secret
</aside>

# Schemas

<h2 id="tocS_AbilityDto">AbilityDto</h2>
<!-- backwards compatibility -->
<a id="schemaabilitydto"></a>
<a id="schema_AbilityDto"></a>
<a id="tocSabilitydto"></a>
<a id="tocsabilitydto"></a>

```json
{
  "name": "string",
  "description": "string",
  "cooldown": {},
  "type": {},
  "iconUrl": {}
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|name|string|true|none|none|
|description|string|true|none|none|
|cooldown|object|false|none|none|
|type|object|false|none|none|
|iconUrl|object|false|none|none|

<h2 id="tocS_ChampionResponseDto">ChampionResponseDto</h2>
<!-- backwards compatibility -->
<a id="schemachampionresponsedto"></a>
<a id="schema_ChampionResponseDto"></a>
<a id="tocSchampionresponsedto"></a>
<a id="tocschampionresponsedto"></a>

```json
{
  "id": "string",
  "slug": "string",
  "name": "string",
  "role": [
    "string"
  ],
  "specialty": [
    "string"
  ],
  "lore": {},
  "releaseDate": {},
  "portraitUrl": {},
  "baseStats": {},
  "abilities": [
    {
      "name": "string",
      "description": "string",
      "cooldown": {},
      "type": {},
      "iconUrl": {}
    }
  ],
  "createdAt": "string",
  "updatedAt": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|slug|string|true|none|none|
|name|string|true|none|none|
|role|[string]|true|none|none|
|specialty|[string]|true|none|none|
|lore|object|false|none|none|
|releaseDate|object|false|none|none|
|portraitUrl|object|false|none|none|
|baseStats|object|true|none|none|
|abilities|[[AbilityDto](#schemaabilitydto)]|true|none|none|
|createdAt|string|true|none|none|
|updatedAt|string|true|none|none|

<h2 id="tocS_ItemComponentDto">ItemComponentDto</h2>
<!-- backwards compatibility -->
<a id="schemaitemcomponentdto"></a>
<a id="schema_ItemComponentDto"></a>
<a id="tocSitemcomponentdto"></a>
<a id="tocsitemcomponentdto"></a>

```json
{
  "slug": "string",
  "name": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|slug|string|true|none|none|
|name|string|true|none|none|

<h2 id="tocS_ItemResponseDto">ItemResponseDto</h2>
<!-- backwards compatibility -->
<a id="schemaitemresponsedto"></a>
<a id="schema_ItemResponseDto"></a>
<a id="tocSitemresponsedto"></a>
<a id="tocsitemresponsedto"></a>

```json
{
  "id": "string",
  "slug": "string",
  "name": "string",
  "type": {},
  "tier": {},
  "cost": {},
  "description": {},
  "passiveName": {},
  "passiveDescription": {},
  "stats": {},
  "components": [
    {
      "slug": "string",
      "name": "string"
    }
  ],
  "imageUrl": {},
  "createdAt": "string",
  "updatedAt": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|slug|string|true|none|none|
|name|string|true|none|none|
|type|object|false|none|none|
|tier|object|false|none|none|
|cost|object|false|none|none|
|description|object|false|none|none|
|passiveName|object|false|none|none|
|passiveDescription|object|false|none|none|
|stats|object|true|none|none|
|components|[[ItemComponentDto](#schemaitemcomponentdto)]|true|none|none|
|imageUrl|object|false|none|none|
|createdAt|string|true|none|none|
|updatedAt|string|true|none|none|



const express = require('express');
var cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const api = axios.create({
  baseURL: process.env.API_URL,
})

const app = express();

app.use(express.json());
app.use(cors({

}));

const PORT = process.env.PORT || 4000;
const SITE_ID = process.env.SITE_ID || 'MLB';

app.get('/', (request, response) => {
  const status = {
    status: "Running",
  };

  response.send(status);
});

const router = express.Router()

router.get('/items/:id', async (request, response) => {
  try {
    const productsResponse = await api.get(`/items/${request.params.id}`);
    const categoryResponse = await api.get(`categories/${productsResponse.data.category_id}`);

    const categories = categoryResponse.data.path_from_root.map(category => category.name);
    const item = {
      id: productsResponse.data.id,
      title: productsResponse.data.title,
      price: {
        currency: productsResponse.data.currency_id,
        amount: productsResponse.data.price,
        decimals: Math.round(productsResponse.data.price % 1 * 100),
      },
      picture_url: productsResponse.data.pictures[0]?.url,
      condition: productsResponse.data.attributes.find(attribute => attribute.id === 'ITEM_CONDITION')?.values[0]?.name ?? productsResponse.data.attributes.condition,
      free_shipping: productsResponse.data.shipping.free_shipping,
      sold_qty: productsResponse.data.sold_quantity,
      description: productsResponse.data.descriptions?.join(' ') ?? '',
    }
    response.send({
      categories,
      item,
    });

  } catch (error) {

    response.status(404).send({
      error,
    })
  }
});

router.get('/items', async (request, response) => {
  const { search } = request.query;

  if (!search) {
    response.status(400).send({
      message: 'Search query not found',
    });
  }

  const productsResponse = await api.get(`/sites/${SITE_ID}/search?q=${search}`);

  const query = productsResponse.data.query;
  const categories = [];
  const items = productsResponse.data.results.map(product => ({
    id: product.id,
    title: product.title,
    price: {
      currency: product.currency_id,
      amount: product.price,
      decimals: Math.round(product.price % 1 * 100),
    },
    picture_url: product.thumbnail,
    condition: product.attributes.find(attribute => attribute.id === 'ITEM_CONDITION')?.values[0]?.name ?? product.attributes.condition,
    free_shipping: product.shipping.free_shipping,
    city_name: product.seller_address.city.name
  }))

  response.send({
    query: 'string',
    categories,
    items,
  });
})

app.use('/api', router);

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});
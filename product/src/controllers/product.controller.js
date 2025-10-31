const { uploadMultipleImages } = require('../services/imagekit.service');
const productModel = require('../models/product.model');
const { default: mongoose } = require('mongoose');
const { deleteFile } = require('../services/imagekit.service');
const { publishToQueue } = require('../broker/broker')

async function createProduct(req, res) {
  try {
    const { title, description, priceAmount, priceCurrency,stock } = req.body;
    const seller = req.user?.id || req.user?._id;

    const product = new productModel({
      title: title.trim(),
      description: description || '',
      price: {
        amount: Number(priceAmount),
        currency: priceCurrency || 'INR',
      },
      seller,
      images: [],
      stock
    });

    if (req.files && req.files.length > 0) {
      const uploadedImages = await uploadMultipleImages(req.files);
      product.images = uploadedImages.map((img) => ({
        url: img.url,
        id: img.fileId,
        thumbnail: img.thumbnailUrl || '',
      }));
    }
    await Promise.all([
      publishToQueue('PRODUCT_SELLER_DASHBOARD.PRODUCT_CREATED', product),
       publishToQueue('PRODUCT_NOTIFICATION.PRODUCT_CREATED', {
        email: req.user.email,
        username:req.user.username,
        productId: product._id,
        sellerId: seller
      })
    ])
    await product.save();
    return res.status(201).json(product);
  } catch (err) {
    console.error('createProduct error:', err);
    return res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
}

async function getProducts(req, res) {

  const { q, minprice, maxprice, skip = 0, limit = 20 } = req.query;

  const filter = {}

  if (q) {
    filter.$text = { $search: q }
  }

  if (minprice) {
    filter['price.amount'] = { ...filter['price.amount'], $gte: Number(minprice) }
  }

  if (maxprice) {
    filter['price.amount'] = { ...filter['price.amount'], $lte: Number(maxprice) }
  }

  const products = await productModel.find(filter).skip(Number(skip)).limit(Number(20));

  return res.status(200).json({ Products: products });
}

async function getProductById(req, res) {
  const { id } = req.params

  const product = await productModel.findById(id)

  if (!product) {
    return res.status(404).json({ message: "product not found" })
  }
  return res.status(200).json({ product: product })
}

async function updateProduct(req, res) {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Product Id" })
  }
  const product = await productModel.findOne({
    _id: id,
  })
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  if (product.seller.toString() != req.user.id) {
    return res.status(403).json({ message: 'Forbidden: You can only update your own product' });
  }
  const allowedUpdates = ['title', 'description', 'price'];
  for (const key of Object.keys(req.body)) {
    if (allowedUpdates.includes(key)) {
      if (key === 'price' && typeof req.body.price === 'object') {
        if (req.body.price.amount !== undefined) {
          product.price.amount = Number(req.body.price.amount);
        }
        if (req.body.price.currency !== undefined) {
          product.price.currency = req.body.price.currency;
        }
      } else {
        product[key] = req.body[key];
      }
    }
  }

  await product.save();
  return res.status(200).json({ message: 'Product updated', product });
}

async function deleteProduct(req, res) {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Product Id" })
  }
  const product = await productModel.findOne({
    _id: id,
  })
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  if (product.seller.toString() != req.user.id) {
    return res.status(403).json({ message: 'Forbidden: You can only update your own product' });
  }
  // Attempt to delete images from ImageKit (if any)
  const fileIds = (product.images || []).map((img) => img.id).filter(Boolean)
  const deletionResults = []
  if (fileIds.length > 0) {
    try {
      const settled = await Promise.allSettled(fileIds.map((fileId) => deleteFile(fileId)))
      settled.forEach((s, idx) => {
        if (s.status === 'fulfilled') {
          deletionResults.push({ fileId: fileIds[idx], status: 'deleted' })
        } else {
          deletionResults.push({ fileId: fileIds[idx], status: 'failed', reason: s.reason && s.reason.message ? s.reason.message : s.reason })
        }
      })
    } catch (e) {
      // Shouldn't reach here because we used allSettled, but log just in case
      console.error('Unexpected error when deleting images from ImageKit:', e)
    }
  }

  await productModel.findOneAndDelete({ _id: id })
  return res.status(200).json({ message: "Product Deleted", imageDeletion: deletionResults })
}

async function getProductsBySeller(req, res) {
  const seller = req.user
  const { skip = 0, limit = 20 } = req.query
  const products = await productModel.find({ seller: seller.id }).skip(skip).limit(Math.min(limit, 20))
  return res.status(200).json({ products: products })
}
module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct, getProductsBySeller };

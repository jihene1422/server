import express from "express";
import asyncHandler from "express-async-handler";
import Product from "./../Models/ProductModel.js";
import { admin, protect } from "./../Middleware/AuthMiddleware.js";

const productRoute = express.Router();
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });
import cloudinary from 'cloudinary';
cloudinary.config({
    cloud_name: "jaweher",
    api_key: "625584927476835",
    api_secret: "5TqNYtpwQkCJ_9wmSKGNobb8_x0"
  });
  
// GET ALL PRODUCT
productRoute.get(
  "/",
  asyncHandler(async (req, res) => {
    const pageSize = 12;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};
    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ _id: -1 });
    res.json({ products, page, pages: Math.ceil(count / pageSize) });
  })
);





// ADMIN GET ALL PRODUCT WITHOUT SEARCH AND PEGINATION
productRoute.get(
  "/all",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ _id: -1 });
    res.json(products);
  })
);

// GET SINGLE PRODUCT
productRoute.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error("Product non trouvé ");
    }
  })
);

// PRODUCT REVIEW
productRoute.post(
  "/:id/review",
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );
      if (alreadyReviewed) {
        res.status(400);
        throw new Error("Produit déjà évalué");
      }
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: "Avis ajouté" });
    } else {
      res.status(404);
      throw new Error("Produit non trouvé");
    }
  })
);

// DELETE PRODUCT
productRoute.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: "Produit supprimé" });
    } else {
      res.status(404);
      throw new Error("Produit non trouvé");
    }
  })
);

// CREATE PRODUCT
/*productRoute.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, price, description, image, countInStock } = req.body;
    const productExist = await Product.findOne({ name });
    if (productExist) {
      res.status(400);
      throw new Error("Product name already exist");
    } else {
      const product = new Product({
        name,
        price,
        description,
        image,
        countInStock,
        user: req.user._id,
      });
      if (product) {
        const createdproduct = await product.save();
        res.status(201).json(createdproduct);
      } else {
        res.status(400);
        throw new Error("Invalid product data");
      }
    }
  })
);*/
productRoute.post('/',  
upload.single('image'),

asyncHandler(async (req, res) => {
  const { name, price, description,  countInStock } = req.body;
  const result = await cloudinary.uploader.upload(req.file.path);
  const productExist = await Product.findOne({ name });
  if (productExist) {
    res.status(400);
    throw new Error("Le nom du produit existe déjà");
  } else {
    const product = new Product({
      name,
      price,
      description,
      image: result.secure_url,
      countInStock,
    
    });
    if (product) {
      const createdproduct = await product.save();
      res.status(201).json(createdproduct);
    } else {
      res.status(400);
      throw new Error(" Données produit non valides");
    }
  }
})
)
productRoute.put('/:id', upload.single('image'), asyncHandler(async (req, res) => {
  const { name, price, description, countInStock } = req.body;
  const { id } = req.params;

  try {
    const product = await Product.findById(id);
    if (!product) {
      res.status(404);
      throw new Error('Produit non trouvé');
    }

    product.name = name;
    product.price = price;
    product.description = description;
    product.countInStock = countInStock;

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      product.image = result.secure_url;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400);
    throw new Error('Échec de la mise à jour du produit');
  }
}));

// UPDATE PRODUCT
/*productRoute.put(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, price, description, image, countInStock } = req.body;
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      product.image = image || product.image;
      product.countInStock = countInStock || product.countInStock;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error("Product not found");
    }
  })
);*/
export default productRoute;

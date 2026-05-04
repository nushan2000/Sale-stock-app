import React from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const ProductList = ({
    products = [],
    addToCart,
    search,
    setSearch,
    manufacture,
    setManufacture
}) => {

    return (
        <div>
            <div className="mb-3 d-flex gap-2">
                <Form.Control 
                    type="text" 
                    placeholder="Search..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <Form.Select
                    value={manufacture}
                    onChange={(e) => setManufacture(e.target.value)}
                    style={{ maxWidth: "200px" }}
                >
                    <option value="">All Manufacturers</option>
                    {/* later load from API */}
                </Form.Select>
            </div>

            <div className="table-responsive">
                <Table striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Stock No</th>
                            <th>Description</th>
                            <th>Stock</th>
                            <th>Price</th>
                            <th>Cart</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td>{product.stockNo}</td>
                                <td>{product.description}</td>
                                <td>{product.amountInStock}</td>
                                <td>Rs.{product.retail?.toFixed(2)}</td>
                                <td>
                                    <Button size="sm" onClick={() => addToCart(product)}>
                                        Add
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default ProductList;
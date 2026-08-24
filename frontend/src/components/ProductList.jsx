import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import API from '../api';

const ProductList = ({
    products = [],
    addToCart,
    search,
    setSearch,
    manufacture,
    setManufacture
}) => {
    const [manufacturers, setManufacturers] = useState([]);

    useEffect(() => {
        API.get('/products/manufacturers')
            .then(r => setManufacturers(r.data || []))
            .catch(() => {});
    }, []);

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
                    {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                </Form.Select>
            </div>

            <div className="table-responsive">
                <Table striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Stock No</th>
                            <th>Description</th>
                            <th>Stock</th>
                            <th>Cost</th>
                            <th>Price</th>
<th>Manufacture</th>
<th>Vendor</th>
                            <th>Cart</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id}>
                                <td>{product.stockNo}</td>
                                <td>{product.description}</td>
                                <td>{product.amountInStock}</td>
                                <td>Rs.{(product.cost ?? 0).toFixed(2)}</td>
                                <td>Rs.{(product.retail ?? 0).toFixed(2)}</td>
                                <td>{product.manufactur}</td>
                                <td>{product.vendor}</td>
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
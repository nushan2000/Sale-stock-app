import React, { useState, useMemo } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const ProductList = ({ products: initialProducts, loading, error, addToCart }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const productList = initialProducts || [];
    
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return productList;
        return productList.filter(product => {
            const search = searchTerm.toLowerCase();
            return (product.description && product.description.toLowerCase().includes(search)) ||
                   (product.stockNo && product.stockNo.toLowerCase().includes(search));
        });
    }, [productList, searchTerm]);

    return (
        <div>
            <div className="mb-3">
                <Form.Control 
                    type="text" 
                    placeholder="Search by description or stock number..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {loading && <p>Loading products...</p>}
            {error && <p className="text-danger">{error}</p>}
            
            <div className="table-responsive">
                <Table striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Stock No</th>
                            <th>Description</th>
                            <th>Stock</th>
                            <th>Cost</th>
                            <th>Price</th>
                            <th>location</th>
                            <th>manufactur</th>
                            {/* <th>retail</th> */}
                            <th>retail2</th>
                            <th>vendor</th>
                            <th>Cart</th>
                            
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map(product => (
                            <tr key={product.id}>
                                <td>{product.stockNo}</td>
                                <td>{product.description}</td>
                                <td>{product.amountInStock}</td>
                                <td>Rs.{product.cost?.toFixed(2) || '0.00'}</td>
                                <td>Rs.{product.retail?.toFixed(2) || '0.00'}</td>
                                <td>{product.location}</td>
                                <td>{product.manufactur}</td>
                                <td>{product.retail2}</td>
                                <td>{product.vendor}</td>
                                <td>
                                    <Button variant="primary" size="sm" onClick={() => addToCart(product)}>
                                        Add to Cart
                                    </Button>
                                    <Button variant="outline-secondary" size="sm" className="ms-2"
                                            onClick={() => alert(`Details for ${product.description}`)}>
                                        Details
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

import React from 'react';
import { Card, Table, Button, Form } from 'react-bootstrap';

const Cart = ({ cart, removeFromCart, checkout, updateUnitPrice }) => {
    const total = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    return (
        <Card>
            <Card.Header>Shopping Cart</Card.Header>
            <Card.Body>
                <Table size="sm" responsive>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map((item, index) => (
                            <tr key={item.product.id}>
                                <td>{item.product.description}</td>
                                <td>{item.quantity}</td>
                                <td>
                                    <Form.Control 
                                        type="number" 
                                        size="sm"
                                        value={item.unitPrice} 
                                        onChange={(e) => updateUnitPrice(item.product.id, e.target.value)} 
                                    />
                                </td>
                                <td>{(item.quantity * item.unitPrice).toFixed(2)}</td>
                                <td>
                                    <Button variant="danger" size="sm" onClick={() => removeFromCart(item.product.id)}>X</Button>
                                </td>
                            </tr>
                        ))}
                        {cart.length === 0 && (
                            <tr><td colSpan="5" className="text-center">Cart is empty</td></tr>
                        )}
                    </tbody>
                </Table>
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <strong>Total: ${total.toFixed(2)}</strong>
                    <Button variant="success" onClick={checkout} disabled={cart.length === 0}>
                        Checkout
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};
export default Cart;

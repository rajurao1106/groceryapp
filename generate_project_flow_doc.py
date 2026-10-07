from docx import Document

output_path = r"c:\Users\RAJU\Documents\VS_code\flutter\grocery-app\Grocery_App_Project_Flow.docx"

doc = Document()

p = doc.add_paragraph()
r = p.add_run("Grocery App Project Flow")
r.bold = True
r.font.size = 22

# Document header
for text in [
    "Project Name: Grocery App",
    "Platform: Flutter / Dart",
    "Architecture: Riverpod + GoRouter + Shell Navigation",
]:
    doc.add_paragraph(text)

doc.add_paragraph("")

doc.add_heading("1. Project Overview", level=1)
doc.add_paragraph(
    "This project is a grocery quick-commerce application prototype built in Flutter. "
    "It follows a typical user buying flow: login, location setup, app onboarding, "
    "browsing products, cart, checkout, payment, and order confirmation. The navigation "
    "is controlled through GoRouter and the app shell manages tab-based browsing."
)

doc.add_heading("2. Main User Flow", level=1)
for item in [
    "Splash Screen",
    "Login Screen",
    "OTP Verification",
    "Location Selection",
    "Map Confirmation",
    "Notification Permission",
    "Home Screen",
    "Search / Product Discovery",
    "Product Detail",
    "Add to Cart / Wishlist",
    "Checkout",
    "Order Confirmation",
    "Order History / Profile",
]:
    doc.add_paragraph(item, style="List Bullet")

doc.add_heading("3. Flow Diagram (Text View)", level=1)
doc.add_paragraph(
    "Splash --> Login --> OTP --> Location --> Map Confirm --> Notification --> Home --> Search --> Product Detail --> Cart --> Checkout --> Payment --> Order Confirmation --> Order Detail/Profile"
)

doc.add_heading("4. Routing and Redirect Logic", level=1)
for item in [
    "If the user is not logged in, the app redirects to /login.",
    "If the user is logged in but onboarding is incomplete, the app directs them to location setup and notification permission.",
    "After successful login, if onboarding is complete, the user is sent to /home.",
    "The app shell contains Home, Categories, Cart, and Wishlist tabs.",
    "Checkout and order confirmation screens are separate routes outside the main shell.",
    "Profile and order screens are accessible from the app and separate navigation routes.",
]:
    doc.add_paragraph(item, style="List Bullet")

doc.add_heading("5. Feature Modules", level=1)
for name, desc in {
    "Authentication": "Login screen and OTP verification.",
    "Location": "Address selection and map confirmation for delivery location.",
    "Notification": "Permission prompt for delivery and marketing alerts.",
    "Home": "Main landing screen for products and categories.",
    "Search": "Product search placeholder and category navigation.",
    "Product Detail": "Detailed view for a selected product with product ID route /product/:id.",
    "Cart": "Cart management screen under app shell.",
    "Wishlist": "Saved items section for later purchases.",
    "Checkout": "Checkout page for delivery and payment summary.",
    "Orders": "Order list and order detail pages.",
    "Profile": "User profile, edit profile, addresses, payment modes, refunds, settings.",
}.items():
    p = doc.add_paragraph()
    r = p.add_run(f"{name}: ")
    r.bold = True
    p.add_run(desc)

doc.add_heading("6. App Shell Navigation", level=1)
for item in [
    "/home",
    "/categories",
    "/cart",
    "/wishlist",
    "/profile",
    "/checkout",
    "/order-confirmation/:orderId",
    "/orders/:orderId",
]:
    doc.add_paragraph(item, style="List Bullet")

doc.add_heading("7. Technology Stack", level=1)
for item in [
    "Flutter / Dart",
    "Riverpod for state management",
    "GoRouter for navigation and redirection",
    "Material 3 themed UI",
    "Google Maps integration for location confirmation",
    "Razorpay-ready payment flow",
]:
    doc.add_paragraph(item, style="List Bullet")

doc.add_heading("8. Summary", level=1)
doc.add_paragraph(
    "The application follows a clean user-first flow: authenticate, set location, browse products, add to cart, complete checkout, and track orders. The routing logic ensures smooth onboarding and prevents unauthorized access before login. This flow is suitable for a grocery quick-commerce mobile application prototype."
)

doc.save(output_path)
print(f"Created: {output_path}")

import React from "react";
import PropTypes from "prop-types";
import { chunk, filter, get, includes, isEmpty, map, take } from "lodash";

import Link from "gatsby-link";

import Header from "../components/header";
import Product from "../components/product";
import SubscribeArea from "../components/subscribeArea";

const PAGE_SIZE = 30;

class Index extends React.Component {
  state = this.getInitialState()

  getInitialState() {
    const activeFilter = this.getFilterState();
    const products = this.getProducts(PAGE_SIZE, activeFilter);
    const allProductCount = this.getProducts(-1, activeFilter).length;

    return ({
      visibleProductCount: PAGE_SIZE,
      allProductCount,
      activeFilter,
      products
    })
  }

  getFilterState() {
    const search = this.props.location.search;
    const params = search.split("?")[1];
    let activeFilter = null;

    if (!isEmpty(params)) {
      const filterParam = params.split("activeFilter=")[1];
      if (!isEmpty(filterParam)) {
        activeFilter = filterParam;
      }
    }
    return activeFilter;
  }

  getProducts(productLimit, activeFilter) {
    const productsData = this.props.data.allProductsJson.edges;
    let products = productsData.map(e => e.node);

    // filter
    if (!isEmpty(activeFilter)) {
      products = filter(products, (product) => {
        return includes(product.tags, activeFilter)
      })
    }
    // paginate
    if (productLimit > 0) {
      return take(products, productLimit);
    } else {
      return products;
    }
  }

  handleFilterClick(event, tag) {
    const products = this.getProducts(PAGE_SIZE, tag);

    this.props.history.push(`/?activeFilter=${tag}`)

    this.setState({
      activeFilter: tag,
      allProductCount: this.getProducts(-1, tag).length,
      products: products,
      visibleProductCount: products.length
    })

    event.preventDefault();
    event.stopPropagation();
  }

  handleClearFilter() {
    const products = this.getProducts(PAGE_SIZE, null);

    this.setState({
      activeFilter: null,
      allProductCount: this.getProducts(-1, null).length,
      products: products,
      visibleProductCount: products.length
    })
  }

  handleShowMore() {
    const visibleProductCount = this.state.visibleProductCount + PAGE_SIZE;

    this.setState({
      products: this.getProducts(visibleProductCount, this.state.activeFilter),
      visibleProductCount
    });
  }

  renderHeader() {
    const clickHandler = () => { this.handleClearFilter() }
    return <Header onClick={clickHandler} />
  }

  renderProduct(product) {
    const clickHandler = (event, tag) => { this.handleFilterClick(event, tag) }
    return (
      <Product key={product.slug}
               onFilterClick={clickHandler}
               product={product}/>
    )
  }

  renderActiveFilter(position) {
    const activeFilter = this.state.activeFilter;

    if (!isEmpty(activeFilter)) {
      const clickHandler = () => { this.handleClearFilter() }
      return (
        <div className={`active-filters-${position}`}>
          <span>
            showing gift ideas in "{this.state.activeFilter}"
          </span>
          <Link className="clear-active-filters"
                onClick={clickHandler}
                to={ "/" }>
            Show all gift ideas
          </Link>
        </div>
      )
    } else {
      return null;
    }
  }

  renderShowMore() {
    const visibleProductCount = this.state.visibleProductCount;
    const allProductCount = this.state.allProductCount;

    if (visibleProductCount < allProductCount) {
      const clickHandler = () => { this.handleShowMore() }
      return (
        <div className="show-more-container">
          <div className="show-more-button" onClick={ clickHandler }>
            Show More
          </div>
        </div>
      )
    }
  }

  renderProductChunk(productChunk, index) {
    return (
      <div className="product-chunk" key={ `product-chunk-${index}` }>
        <div className="product-tiles">
          {
            map(productChunk, (product) => {
              return this.renderProduct(product)
            })
          }
        </div>
        <SubscribeArea />
      </div>
    )
  }

  render() {
    const products = this.state.products;
    const productChunks = chunk(products, PAGE_SIZE);

    if (isEmpty(products) && typeof(window) !== "undefined") {
      window.location = "/"
    }

    return (
      <div>
        { this.renderHeader() }
        <div className="body-container">
          <div>
            { this.renderActiveFilter("top") }
            {
              map(productChunks, (productChunk, index) => {
                return (this.renderProductChunk(productChunk, index))
              })
            }
            { this.renderActiveFilter("bottom") }
          </div>
          { this.renderShowMore() }
        </div>
      </div>
    )
  }
}

export default Index

export const pageQuery = graphql`
  query AllProductsQuery {
    allProductsJson {
      edges {
        node {
          amazonUrl
          category
          description
          price
          purchaseUrl
          slug
          tags
          title
          ...Product_details
          ...ProductDetail_details
        }
      }
    }
  }
`

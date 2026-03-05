"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  stacklineSku: string;
  title: string;
  categoryName: string;
  subCategoryName: string;
  imageUrls: string[];
}

const PAGE_SIZE = 20;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories));
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetch(`/api/subcategories?category=${encodeURIComponent(selectedCategory)}`)
        .then((res) => res.json())
        .then((data) => setSubCategories(data.subCategories));
    } else {
      setSubCategories([]);
      setSelectedSubCategory(undefined);
    }
  }, [selectedCategory]);

  useEffect(() => {
    setLoading(true);
    setOffset(0);
    setHasMore(true);

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedSubCategory) params.append("subCategory", selectedSubCategory);
    params.append("limit", String(PAGE_SIZE));
    params.append("offset", "0");

    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data.products);
        setHasMore(PAGE_SIZE < data.total);
        setLoading(false);
      });
  }, [search, selectedCategory, selectedSubCategory]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const nextOffset = offset + PAGE_SIZE;
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedCategory) params.append("category", selectedCategory);
    if (selectedSubCategory) params.append("subCategory", selectedSubCategory);
    params.append("limit", String(PAGE_SIZE));
    params.append("offset", String(nextOffset));
    fetch(`/api/products?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts((prev) => [...prev, ...data.products]);
        setOffset(nextOffset);
        setHasMore(nextOffset + data.products.length < data.total);
        setLoadingMore(false);
      });
  }, [loadingMore, hasMore, offset, search, selectedCategory, selectedSubCategory]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold mb-6">StackShop</h1>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v || undefined)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory && subCategories.length > 0 && (
              <Select value={selectedSubCategory} onValueChange={(v) => setSelectedSubCategory(v || undefined)}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((subCat) => (
                    <SelectItem key={subCat} value={subCat}>{subCat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(search || selectedCategory || selectedSubCategory) && (
              <Button variant="outline" onClick={() => { setSearch(""); setSelectedCategory(""); setSelectedSubCategory(""); }}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {products.length} products
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link
                  key={product.stacklineSku}
                  href={{ pathname: "/product", query: { product: JSON.stringify(product) } }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-visible">
                    <CardHeader className="p-0">
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-muted">
                        {product.imageUrls[0] && (
                          <Image
                            src={product.imageUrls[0]}
                            alt={product.title}
                            fill
                            className="object-contain p-4"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 overflow-visible">
                      <div className="relative group mb-2">
                        <CardTitle className="text-base line-clamp-2">
                          {product.title}
                        </CardTitle>
                        <div className="absolute bottom-full left-0 z-10 hidden group-hover:block bg-popover text-popover-foreground text-sm rounded-md shadow-md p-2 w-64 border">
                          {product.title}
                        </div>
                      </div>
                                  
                <CardDescription className="flex gap-2 items-center">
                  <div className="relative group/cat shrink-0">
                    <Badge variant="secondary" className="max-w-[110px] truncate block cursor-default">
                      {product.categoryName}
                    </Badge>
                    <div className="absolute bottom-full left-0 mb-1 z-50 hidden group-hover/cat:block bg-popover text-popover-foreground text-xs rounded-md shadow-md px-2 py-1 border whitespace-nowrap">
                      {product.categoryName}
                    </div>
                  </div>

                  <div className="relative group/sub shrink-0">
                    <Badge variant="outline" className="max-w-[110px] truncate block cursor-default">
                      {product.subCategoryName}
                    </Badge>
                    <div className="absolute bottom-full left-0 mb-1 z-50 hidden group-hover/sub:block bg-popover text-popover-foreground text-xs rounded-md shadow-md px-2 py-1 border whitespace-nowrap">
                      {product.subCategoryName}
                    </div>
                  </div>
                </CardDescription>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">View Details</Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>

          </>
        )}

        <div ref={sentinelRef} className="py-8 text-center">
          {loadingMore && <p className="text-muted-foreground">Loading more...</p>}
          {!loading && !hasMore && products.length > 0 && (
            <p className="text-muted-foreground text-sm">You've reached the end</p>
          )}
        </div>
      </main>
    </div>
  );
}
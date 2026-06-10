package com.nanopay.common.response;

import lombok.Getter;

import java.util.List;

/**
 * Wraps paginated results. Keeps pagination metadata out of the domain layer.
 * Controllers should construct this DTO from their pagination source.
 */
@Getter
public class PagedResponse<T> {

    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;
    private final boolean last;

    public PagedResponse(List<T> content,
                         int page,
                         int size,
                         long totalElements,
                         int totalPages,
                         boolean last) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.last = last;
    }
}
